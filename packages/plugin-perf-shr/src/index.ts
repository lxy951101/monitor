import type { MonitorContext, Plugin } from "@monitor/core";
import { PerfCache, sendWithPerfCache } from "@monitor/plugin-perf-cache";
import { createPerfCustomPayload, type PerfLog } from "@monitor/protocol";
import type { BridgeCallbacks, BridgeLike, TransportRequest, TransportResponse } from "@monitor/transport";

export const packageName = "@monitor/plugin-perf-shr";

const FRAME_BUDGET = 1000 / 60;
type SendFn = (request: TransportRequest) => Promise<TransportResponse | void>;

export interface ScrollMetricsInput {
  startTime: number;
  endTime: number;
  frameTimes: number[];
}

export interface ScrollMetrics extends PerfLog {
  duration: number;
  frames: number;
  fps: number;
  frameDropRate: number;
}

export interface ShrManagerOptions {
  send: SendFn;
  endpoint: string;
  project?: string;
  pagePath?: string;
  sample?: number;
  timeout?: number;
  tags?: Record<string, string>;
  cache?: PerfCache;
  random?: () => number;
  containerBridge?: BridgeLike;
}

export class ShrManager {
  private readonly options: ShrManagerOptions;

  constructor(options: ShrManagerOptions) {
    this.options = options;
  }

  async report(input: ScrollMetricsInput): Promise<void> {
    if (!isSampled(this.options.sample, this.options.random)) {
      return;
    }

    const metrics = calculateScrollMetrics(input);
    if (this.options.containerBridge) {
      await this.reportContainerEnd(input);
      return;
    }
    await sendWithPerfCache(this.createRequest(metrics), this.options.send, this.options.cache);
  }

  async reportScrollState(scrollStartTime: number, scrollEndTime: number, costMs = 0): Promise<void> {
    if (!this.options.containerBridge) {
      return;
    }
    await reportWithContainerBridge(this.options.containerBridge, {
      pagePath: this.options.pagePath ?? "",
      techStack: "knb",
      scrollStartTime,
      scrollEndTime,
      extra: {
        ...(this.options.tags ?? {}),
        $sr: Math.min(this.options.sample ?? 1, 1),
        appId: this.options.project ?? "",
        gatherSource: "js",
        costMs
      }
    });
  }

  private createRequest(metrics: ScrollMetrics): TransportRequest {
    return {
      method: "POST",
      url: this.options.endpoint,
      timeout: this.options.timeout,
      body: JSON.stringify(createPerfCustomPayload({
        category: "shr_web",
        env: this.options.tags,
        metrics
      })),
      headers: {
        "content-type": "application/json;charset=UTF-8"
      }
    };
  }

  private async reportContainerEnd(input: ScrollMetricsInput): Promise<void> {
    await this.reportScrollState(input.startTime, input.endTime, 0);
  }
}

export interface ShrPluginOptions {
  onReady?: (manager: ShrManager) => void;
  cache?: PerfCache;
  random?: () => number;
  runtime?: ShrRuntime;
  idleDelay?: number;
  containerBridge?: BridgeLike;
  metadata?: {
    project?: string;
    pagePath?: string;
  };
}

export interface ShrRuntime {
  addEventListener: (type: "scroll", listener: (event?: { target?: unknown }) => void, options?: AddEventListenerOptions) => void;
  removeEventListener: (type: "scroll", listener: (event?: { target?: unknown }) => void) => void;
  requestAnimationFrame: (callback: (time: number) => void) => number;
  cancelAnimationFrame?: (id: number) => void;
  now: () => number;
  getScrollValue?: (target: unknown) => number;
}

export function createShrPlugin(options: ShrPluginOptions = {}): Plugin {
  let manager: ShrManager | undefined;
  let stopWatch: (() => void) | undefined;
  return {
    name: packageName,
    start(context: MonitorContext) {
      const perf = context.cfgManager.getConfig("perf");
      if (!perf.enable || !perf.shr.enable) {
        return;
      }

      manager = new ShrManager({
        send: context.transport.send.bind(context.transport),
        endpoint: perf.shr.endpoint,
        project: options.metadata?.project ?? context.cfgManager.getConfig("project"),
        pagePath: options.metadata?.pagePath,
        sample: perf.shr.sample,
        timeout: perf.shr.timeout,
        tags: perf.shr.customTags,
        cache: options.cache,
        random: options.random,
        containerBridge: options.containerBridge
      });
      options.onReady?.(manager);
      stopWatch = watchScrollRuntime(manager, options.runtime, options.idleDelay);
    },
    stop() {
      stopWatch?.();
      stopWatch = undefined;
      manager = undefined;
    }
  };
}

export function calculateScrollMetrics(input: ScrollMetricsInput): ScrollMetrics {
  const duration = Math.max(0, input.endTime - input.startTime);
  const frames = input.frameTimes.length;
  const frameTimeDiff = calculateFrameTimeDiff(input.frameTimes);
  return {
    duration,
    frames,
    fps: duration > 0 ? Math.round((frames * 1000) / duration) : 0,
    frameDropRate: duration > 0 ? Math.round((frameTimeDiff / duration) * 1000) : 0
  };
}

function calculateFrameTimeDiff(frameTimes: number[]): number {
  let diff = 0;
  for (let index = 1; index < frameTimes.length; index += 1) {
    const gap = frameTimes[index] - frameTimes[index - 1];
    diff += Math.max(0, gap - FRAME_BUDGET);
  }
  return diff;
}

function isSampled(sample = 1, random: () => number = Math.random): boolean {
  return sample >= 1 || random() < sample;
}

function watchScrollRuntime(manager: ShrManager, runtime = getRuntime(), idleDelay = 120): (() => void) | undefined {
  if (!runtime) {
    return undefined;
  }

  const state = createScrollState(manager, runtime, idleDelay);
  runtime.addEventListener("scroll", state.onScroll);
  return () => {
    state.stop();
    runtime.removeEventListener("scroll", state.onScroll);
  };
}

function createScrollState(manager: ShrManager, runtime: ShrRuntime, idleDelay: number) {
  const frameTimes: number[] = [];
  let startTime = 0;
  let lastScrollValue = 0;
  let lastScrollChangeTime = runtime.now();
  let animationFrameId: number | undefined;
  let isScrolling = false;
  let scrollTarget: unknown;
  const stop = () => {
    if (animationFrameId !== undefined) {
      runtime.cancelAnimationFrame?.(animationFrameId);
      animationFrameId = undefined;
    }
  };
  const onScroll = (event?: { target?: unknown }) => {
    const target = event?.target;
    if (isScrolling && target !== scrollTarget) {
      return;
    }
    const now = runtime.now();
    const currentValue = getScrollValue(runtime, target);
    if (currentValue !== lastScrollValue) {
      lastScrollValue = currentValue;
      lastScrollChangeTime = now;
    }
    if (!isScrolling) {
      isScrolling = true;
      scrollTarget = target;
      startTime = now;
      void manager.reportScrollState(startTime, 0);
      startTracking();
    }
  };
  const startTracking = () => {
    if (animationFrameId !== undefined) {
      return;
    }
    animationFrameId = runtime.requestAnimationFrame(trackFrame);
  };
  const trackFrame = (time: number) => {
    animationFrameId = undefined;
    frameTimes.push(time);
    const now = runtime.now();
    const currentValue = getScrollValue(runtime, scrollTarget);
    if (currentValue !== lastScrollValue) {
      lastScrollValue = currentValue;
      lastScrollChangeTime = now;
    }
    if (isScrolling && now - lastScrollChangeTime > idleDelay) {
      const endTime = lastScrollChangeTime;
      void manager.report({ startTime, endTime, frameTimes: [...frameTimes] });
      isScrolling = false;
      scrollTarget = undefined;
      frameTimes.length = 0;
      return;
    }
    if (isScrolling) {
      animationFrameId = runtime.requestAnimationFrame(trackFrame);
    }
  };
  return { onScroll, stop };
}

function getRuntime(): ShrRuntime | undefined {
  if (typeof window === "undefined" || typeof performance === "undefined") {
    return undefined;
  }

  return {
    addEventListener: window.addEventListener.bind(window),
    removeEventListener: window.removeEventListener.bind(window),
    requestAnimationFrame: window.requestAnimationFrame.bind(window),
    cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
    now: performance.now.bind(performance),
    getScrollValue: (target) => {
      if (!target || target === document || target === document.documentElement) {
        return window.scrollY || document.documentElement.scrollTop;
      }
      return typeof (target as { scrollTop?: unknown }).scrollTop === "number"
        ? (target as { scrollTop: number }).scrollTop
        : 0;
    }
  };
}

function getScrollValue(runtime: ShrRuntime, target: unknown): number {
  return runtime.getScrollValue?.(target) ?? 0;
}

function reportWithContainerBridge(bridge: BridgeLike, event: Record<string, unknown>): Promise<void> {
  const method = bridge["shr.sendScrollStateTime"];
  if (typeof method !== "function") {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    (method as (event: Record<string, unknown>, callbacks: BridgeCallbacks) => void)(event, {
      success: () => resolve(),
      fail: (error) => reject(error instanceof Error ? error : new Error("shr bridge failed"))
    });
  });
}
