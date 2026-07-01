import { safeJsonStringify } from "@monitor/core";
import type { FirstScreenResult } from "./first-screen";

export interface FstPerfAnalysis {
  slow: boolean;
  summary: {
    fst: number;
    threshold: number;
    score: number;
  };
  detail: string;
}

/**
 * 基础首屏性能分析：判断 FST 是否超过阈值。
 */
export function fstPerfAnalysis(
  result: FirstScreenResult,
  threshold = 3000,
): FstPerfAnalysis {
  return {
    slow: result.time > threshold,
    summary: {
      fst: result.time,
      threshold,
      score: result.score,
    },
    detail: safeJsonStringify(result.detail),
  };
}

// ─── 资源汇总（对齐 owl.js parseFirstScreenPerf） ─────────────────────

export interface ResourceSumInfo {
  picCount: number;
  picSize: number;
  jsCount: number;
  jsSize: number;
  cssCount: number;
  cssSize: number;
  ajaxCount: number;
}

export interface SlowViewResource {
  /** 资源 URL 的域名部分 */
  domain: string;
  /** 资源 URL 的路径部分 */
  path: string;
  /**
   * 资源详情字符串:
   * size,time,start,dns,tcp,ssl,ttfb,load,stalled,hit
   */
  detail: string;
}

export interface SlowViewData {
  js: Record<string, [string, string][]>;
  css: Record<string, [string, string][]>;
  img: Record<string, [string, string][]>;
  ajax: Record<string, [string, string][]>;
}

export interface FstPerfFullReport {
  /** 汇总数据 */
  sumInfo: ResourceSumInfo;
  /** 慢访问个案数据（仅命中采样时返回） */
  slowView?: SlowViewData;
  /** FST 时间 */
  fst: number;
}

const IMG_PATTERN = /\.(png|jpg|jpeg|gif|webp|ico|bmp|tiff|svg)/i;
const JS_PATTERN = /\.js(\?|$)/i;
const CSS_PATTERN = /\.css(\?|$)/i;
const URL_PATTERN = /(https?:\/\/[^/]*)(\/[^?]*)/;

/**
 * 分析首屏资源性能（对齐 owl.js parseFirstScreenPerf）。
 *
 * 需要传入：
 * - fst: 首屏时间（ms）
 * - resEntries: performance.getEntriesByType('resource') 的结果
 * - opts: 采样配置
 *
 * 返回汇总数据，命中采样率时附带慢访问个案数据。
 */
export function analyzeFirstScreenResources(
  fst: number,
  resEntries: PerformanceResourceTiming[],
  opts: {
    /** 首屏性能汇总采样率，默认 1（全量）。 */
    fstPerfSample?: number;
    /** 是否启用慢访问日志，默认 false。 */
    logSlowView?: boolean;
    /** 慢访问 FST 阈值（ms），超过此值才可能记录慢访问。默认 1000。 */
    slowViewThreshold?: number;
  } = {},
): FstPerfFullReport {
  const fstPerfSample = opts.fstPerfSample ?? 1;
  const logSlowView = opts.logSlowView ?? false;
  const slowViewThreshold = opts.slowViewThreshold ?? 1000;

  const sumInfo: ResourceSumInfo = {
    picCount: 0,
    picSize: 0,
    jsCount: 0,
    jsSize: 0,
    cssCount: 0,
    cssSize: 0,
    ajaxCount: 0,
  };

  const slowView: SlowViewData = {
    js: {},
    css: {},
    img: {},
    ajax: {},
  };

  const random = Math.random();
  const logSumInfo = random < fstPerfSample;
  const sampleRate = fst < 2000 ? 0.05 : 0.1;
  const shouldLogSlowView =
    logSlowView && fst > slowViewThreshold && random < sampleRate;

  for (const res of resEntries) {
    // 只统计首屏时间之前的资源
    if (!res.fetchStart || res.fetchStart >= fst) continue;

    const name = res.name || "";
    const initType = res.initiatorType || "";
    const size = res.transferSize || 0;

    // 分类汇总
    let type: "img" | "js" | "css" | "ajax" | "" = "";

    if (initType === "img" || IMG_PATTERN.test(name)) {
      type = "img";
      sumInfo.picCount++;
      sumInfo.picSize += size;
    } else if (
      initType === "script" ||
      (initType === "link" && JS_PATTERN.test(name))
    ) {
      type = "js";
      sumInfo.jsCount++;
      sumInfo.jsSize += size;
    } else if (
      initType === "css" ||
      (initType === "link" && CSS_PATTERN.test(name))
    ) {
      type = "css";
      sumInfo.cssCount++;
      sumInfo.cssSize += size;
    } else if (
      initType === "xmlhttprequest" ||
      initType === "fetch" ||
      initType === "beacon"
    ) {
      type = "ajax";
      sumInfo.ajaxCount++;
    }

    // 慢访问个案数据
    if (shouldLogSlowView && type && name) {
      const matches = name.match(URL_PATTERN);
      if (matches?.[1] && matches?.[2]) {
        const bodySize = res.decodedBodySize || 0;
        const duration = res.duration || 0;
        const time = clampTime(res.responseEnd - res.fetchStart);
        const start = clampTime(res.fetchStart);
        const stalled = clampTime(
          res.domainLookupStart - res.fetchStart,
        );
        const dns = clampTime(
          res.domainLookupEnd - res.domainLookupStart,
        );
        const tcp = clampTime(res.connectEnd - res.connectStart);
        const ssl = clampTime(
          res.connectEnd - ((res as unknown as Record<string, number>).secureConnectionStart || 0),
        );
        const ttfb = clampTime(
          res.responseStart - res.requestStart,
        );
        const load = clampTime(
          res.responseEnd - res.responseStart,
        );
        const hit =
          size > 0 ? 0 : bodySize > 0 ? 1 : duration < 30 ? 1 : 0;

        const logStr = [
          size,
          time,
          start,
          dns,
          tcp,
          ssl,
          ttfb,
          load,
          stalled,
          hit,
        ].join(",");

        const domain = matches[1];
        const path = matches[2];

        if (!logSumInfo) continue;

        const bucket = slowView[type];
        if (bucket) {
          if (Array.isArray(bucket[domain])) {
            bucket[domain].push([path, logStr]);
          } else {
            bucket[domain] = [[path, logStr]];
          }
        }
      }
    }
  }

  return {
    sumInfo: logSumInfo ? sumInfo : { picCount: 0, picSize: 0, jsCount: 0, jsSize: 0, cssCount: 0, cssSize: 0, ajaxCount: 0 },
    slowView: shouldLogSlowView ? slowView : undefined,
    fst,
  };
}

/**
 * 获取浏览器资源 Timing 条目。
 */
export function getResourceEntries():
  | PerformanceResourceTiming[]
  | undefined {
  if (typeof performance === "undefined") return undefined;
  const perf = performance as Performance & {
    getEntriesByType?: (type: string) => PerformanceEntry[];
  };
  if (typeof perf.getEntriesByType !== "function") return undefined;
  return perf.getEntriesByType(
    "resource",
  ) as PerformanceResourceTiming[];
}

function clampTime(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value);
}
