import { CfgManager, getPageUrl, type CoreConfigPatch } from "@monitor/core";
import type { TransportRequest, TransportResponse } from "@monitor/transport";
import { calculateFirstScreen, type FirstScreenNode } from "./first-screen";
import {
  buildSpeedPoints,
  encodePageSpeedFromTiming,
  getPaintEntries,
  type NavigationTimingLike,
} from "./navigation-timing";

type SendFn = (request: TransportRequest) => Promise<TransportResponse | void>;

export interface PageManagerOptions extends CoreConfigPatch {
  send: SendFn;
  cfgManager?: CfgManager;
  pageUrl?: string;
  realUrl?: string;
  /** 上报延迟（ms），用于防抖合并。默认 0 表示立即上报。与 owl.js delay 一致。 */
  delay?: number;
  /** 缓存判定时资源耗时的最低阈值（ms），duration > threshold 视为非缓存。默认 30。 */
  timeThreshold?: number;
  /** 关键资源数量上限，默认 5。 */
  mainResourceNumber?: number;
  /** 自定义关键资源过滤器，不传则按 link/script 筛选。 */
  isMainResource?: (entry: PerformanceResourceTiming) => boolean;
}

/**
 * 页面测速管理器，对齐 owl.js PageManager。
 *
 * 核心职责：
 * 1. 采集 W3C Navigation Timing + Paint Timing，组装为 27 点位数组
 * 2. 支持首屏时间 (FST) 结果合并到点位 25/26
 * 3. 上报前支持 delay 防抖（重复调用会重置计时器）
 * 4. 自动检测页面缓存状态（noCache）
 * 5. 支持外部填入自定义测速点位（addPoint）
 */
export class PageManager {
  private readonly cfgManager: CfgManager;
  private readonly send: SendFn;
  private readonly options: PageManagerOptions;

  private points: number[] = [];
  private pointsCustom: number[] = [];
  private noCache = "false";
  private isReady = false;
  private userReady = false;
  private initialPage?: string;
  private initialProject?: string;
  private timeout: ReturnType<typeof setTimeout> | undefined;

  constructor(options: PageManagerOptions) {
    this.options = options;
    this.send = options.send;
    this.cfgManager = options.cfgManager ?? new CfgManager(options);
  }

  // ─── 初始配置 ───────────────────────────────────────────────

  /**
   * 保存初始化时的 pageUrl 和 project。
   * 因 FST 指标在 load 后异步计算，期间用户可能修改配置，
   * 所以预先存储初始值供上报时使用。
   */
  setInitConfig(init?: { pageUrl?: string; project?: string }): void {
    this.initialPage = init?.pageUrl ?? this.options.pageUrl ?? getPageUrl();
    this.initialProject = init?.project ?? this.cfgManager.getConfig("project");
  }

  // ─── 就绪状态 ───────────────────────────────────────────────

  /** 页面测速采集已完成（Navigation Timing 已解析）。 */
  setReady(): void {
    this.isReady = true;
  }

  getReady(): boolean {
    return this.isReady;
  }

  /**
   * 标记用户已就绪（addPoint 或业务主动调用）。
   * 仅当 setReady 且 setUserReady 均为 true 时，数据才允许发送。
   * 对齐 owl.js setUserReady / getUserReady。
   */
  setUserReady(): void {
    this.userReady = true;
  }

  getUserReady(): boolean {
    return this.userReady;
  }

  // ─── 性能数据采集 ───────────────────────────────────────────

  /** 获取原始 performance.timing 和 paint 条目。 */
  getPerformanceTiming(): { perf?: NavigationTimingLike; paint?: ReturnType<typeof getPaintEntries> } {
    if (typeof performance === "undefined") {
      return {};
    }
    return {
      perf: (performance as unknown as { timing?: NavigationTimingLike }).timing,
      paint: getPaintEntries(),
    };
  }

  /**
   * 获取关键资源 Timing（用于缓存检测）。
   * 默认筛选 initiatorType 为 link 或 script 的资源，
   * 可通过 options.isMainResource 自定义。
   */
  getMainResourceTiming(): PerformanceResourceTiming[] | undefined {
    if (typeof performance === "undefined") return undefined;
    const perf = performance as Performance & {
      getEntriesByType?: (type: string) => PerformanceEntry[];
    };
    if (typeof perf.getEntriesByType !== "function") return undefined;

    const entries = perf.getEntriesByType("resource") as PerformanceResourceTiming[];
    if (!entries?.length) return undefined;

    const filter = this.options.isMainResource;
    try {
      if (typeof filter === "function") {
        return entries.filter(filter);
      }

      const mainResources = entries.filter(
        (r) => r.initiatorType === "link" || r.initiatorType === "script",
      );
      const max = this.options.mainResourceNumber ?? 5;
      return mainResources.length <= max ? mainResources : mainResources.slice(0, max);
    } catch {
      return undefined;
    }
  }

  // ─── 解析 & 上报 ────────────────────────────────────────────

  /**
   * 解析 Navigation Timing + Paint Timing，组装完整 27 点位，
   * 检测缓存状态，设置 ready 并触发上报。
   *
   * senseTime 可选，格式：{ FST?: number; FCP?: number }，
   * 分别填入 points[25] 和 points[26]。
   */
  parsePageTime(senseTime?: { FST?: number; FCP?: number }): void {
    const { perf, paint } = this.getPerformanceTiming();
    if (!perf) {
      this.setReady();
      return;
    }

    this.points = buildSpeedPoints(perf, paint);

    // 合并 FST / FCP 到点位 25 / 26
    if (senseTime) {
      const fcp = senseTime.FCP ?? 0;
      this.points[25] =
        senseTime.FST && senseTime.FST > fcp ? senseTime.FST : fcp;
      this.points[26] = fcp;
    }

    // 清理非法值
    for (let i = 0; i < this.points.length; i++) {
      if (isNaN(this.points[i]) || this.points[i] < 0) {
        this.points[i] = 0;
      }
    }

    // 缓存检测
    const resTiming = this.getMainResourceTiming();
    if (resTiming?.length) {
      const threshold = this.options.timeThreshold ?? 30;
      for (const res of resTiming) {
        if (res.transferSize !== undefined) {
          if (res.transferSize !== 0) this.noCache = "true";
        } else if (res.duration !== undefined) {
          if (res.duration > threshold) this.noCache = "true";
        }
      }
    }

    this.setReady();
    this.report();
  }

  /**
   * 异步解析页面测速（对齐 owl.js parsePageTimeWithDefer）。
   * 在下一个宏任务中执行，确保 DOM 已稳定。
   */
  parsePageTimeWithDefer(senseTime?: { FST?: number; FCP?: number }): void {
    setTimeout(() => {
      try {
        this.parsePageTime(senseTime);
      } catch {
        this.parsePageTime();
      }
    }, 0);
  }

  // ─── 导航计时上报（兼容旧接口） ─────────────────────────────

  reportNavigationTiming(timing: NavigationTimingLike): Promise<void> {
    const points = encodePageSpeedFromTiming(timing)
      .split("|")
      .map(Number);
    return this.reportCustomSpeedOld(points);
  }

  // ─── 首屏上报 ───────────────────────────────────────────────

  reportFirstScreen(nodes: FirstScreenNode[], viewportHeight: number): Promise<void> {
    const result = calculateFirstScreen(nodes, viewportHeight);
    return this.reportCustomSpeedOld([result.time, result.score]);
  }

  /**
   * 上报路由首屏时间（SPA 路由切换后的 FST）。
   * 对齐 owl.js reportRouteFst。
   */
  reportRouteFst(fst: number, pageUrl: string): void {
    const rawPoints: number[] = [];
    rawPoints[27] = fst;
    this.doSend(rawPoints, [], pageUrl);
  }

  // ─── 自定义点位 ─────────────────────────────────────────────

  /**
   * 填入自定义测速点位，对齐 owl.js push()。
   * position 范围 0-31，duration 为耗时（ms）。
   */
  addPoint(point: { position: number; duration?: number }): void {
    if (
      !point ||
      typeof point.position !== "number" ||
      point.position < 0 ||
      point.position > 31
    ) {
      return;
    }
    this.pointsCustom[point.position] = point.duration ?? 0;
    this.report();
  }

  // ─── 发送逻辑 ───────────────────────────────────────────────

  /** 兼容旧接口的内部上报方法：将 points 作为 customspeed 通过 GET 上报。 */
  private async reportCustomSpeedOld(pts: number[]): Promise<void> {
    const data = new URLSearchParams();
    data.set("project", this.cfgManager.getConfig("project"));
    data.set("pageurl", encodeURIComponent(this.options.pageUrl ?? getPageUrl()));
    data.set("customspeed", encodeURIComponent(pts.join("|")));
    data.set("timestamp", String(Date.now()));

    await this.send({
      method: "GET",
      url: `${this.cfgManager.getApiPath("speedTs")}?${data.toString()}`,
    });
  }

  /** 防抖上报：每次调用会重置 delay 计时器。 */
  report(reportNow?: boolean): void {
    const catchPage = this.cfgManager.getConfig("autoCatch").page;
    if (catchPage && !this.getReady()) return;
    if (!this.getUserReady()) return;
    if (!this.points.length && !this.pointsCustom.length) return;

    this.clearTimeout();

    const delay = this.options.delay ?? 0;
    if (reportNow) {
      this.doSend(this.points, this.pointsCustom);
    } else if (delay >= 0) {
      this.timeout = setTimeout(() => {
        this.doSend(this.points, this.pointsCustom);
      }, delay);
    }
  }

  private clearTimeout(): void {
    if (this.timeout !== undefined) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
  }

  /**
   * 实际发送逻辑。
   * 默认使用初始 pageUrl/project（采集时刻的值），
   * 确保异步计算完 FST 后用户已修改配置也不影响上报准确性。
   */
  private doSend(
    pts: number[],
    customPts: number[],
    overridePageUrl?: string,
  ): void {
    this.clearTimeout();
    if (!pts.length && !customPts.length) return;

    const cfg = this.cfgManager.getConfig();
    const pageUrl =
      overridePageUrl ??
      (pts.length ? this.initialPage : undefined) ??
      this.options.pageUrl ??
      getPageUrl();
    const project =
      (pts.length ? this.initialProject : undefined) ??
      cfg.project;

    const data = new URLSearchParams();
    data.set("project", project);
    data.set("pageurl", encodeURIComponent(pageUrl));
    data.set("speed", encodeURIComponent(pts.join("|")));
    data.set("customspeed", encodeURIComponent(customPts.join("|")));
    data.set("timestamp", String(Date.now()));
    data.set("noCache", this.noCache);

    const exts = this.cfgManager.getExtensions();
    if (exts) {
      for (const [k, v] of Object.entries(exts)) {
        if (v !== undefined && v !== null) {
          data.set(k, String(v));
        }
      }
    }

    // 清空已发送数据
    this.points = [];
    this.pointsCustom = [];

    const url = `${this.cfgManager.getApiPath("speedTs")}?${data.toString()}`;
    this.send({
      method: "GET",
      url,
    }).catch(() => {
      // 静默失败
    });
  }
}
