import {
 createPerfMetadata,
 type MonitorContext,
 type PerfMetadata,
 type PerfRunEnv,
 type Plugin,
} from "@monitor/core";
import { PerfCache, sendWithPerfCache } from "@monitor/plugin-perf-cache";
import { createPerfCustomPayload, type PerfLog } from "@monitor/protocol";
import type {
 BridgeCallbacks,
 BridgeLike,
 TransportRequest,
 TransportResponse,
} from "@monitor/transport";

export const packageName = "@monitor/plugin-perf-shr";

const FRAME_BUDGET = 1000 / 60;
const TAG = "[shr]";
type SendFn = (request: TransportRequest) => Promise<TransportResponse | void>;

const logger = {
 log(...args: unknown[]): void {
  console.log(TAG, ...args);
 },
 error(...args: unknown[]): void {
  console.error(TAG, ...args);
 },
};

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
 costMs: number;
}

export interface ShrManagerOptions {
 send: SendFn;
 endpoint: string;
 project?: string;
 pagePath?: string;
 metadata?: PerfPluginMetadata;
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

 async report(input: ScrollMetricsInput, costMs = 0): Promise<void> {
  if (!isSampled(this.options.sample, this.options.random)) {
   return;
  }

  const metrics = calculateScrollMetrics(input, costMs);
  if (this.options.containerBridge) {
   await this.reportContainerEnd(input);
   return;
  }
  await sendWithPerfCache(
   this.createRequest(metrics),
   this.options.send,
   this.options.cache,
  );
 }

 async reportScrollState(
  scrollStartTime: number,
  scrollEndTime: number,
  costMs = 0,
 ): Promise<void> {
  if (!this.options.containerBridge) {
   return;
  }
  await reportWithContainerBridge(this.options.containerBridge, {
   pagePath: this.options.pagePath ?? "",
   techStack: "container",
   scrollStartTime,
   scrollEndTime,
   extra: {
    ...this.createEnv(),
    $sr: Math.min(this.options.sample ?? 1, 1),
    appId: this.options.project ?? "",
    gatherSource: "js",
    costMs,
   },
  });
 }

 private createRequest(metrics: ScrollMetrics): TransportRequest {
  return {
   method: "POST",
   url: this.options.endpoint,
   timeout: this.options.timeout,
   body: JSON.stringify(
    createPerfCustomPayload({
     category: "shr_web",
     env: this.createEnv(),
     metrics,
    }),
   ),
   headers: {
    "content-type": "application/json;charset=UTF-8",
   },
  };
 }

 private async reportContainerEnd(input: ScrollMetricsInput): Promise<void> {
  await this.reportScrollState(input.startTime, input.endTime, 0);
 }

 private createEnv(): Record<string, string | number | boolean> {
  return compactRecord({
   ...this.options.metadata,
   ...this.options.tags,
   project: this.options.project,
   pagePath: this.options.pagePath,
  });
 }
}

export interface PerfPluginMetadata extends Partial<PerfMetadata> {
 runEnv?: PerfRunEnv;
}

export interface ShrPluginOptions {
 onReady?: (manager: ShrManager) => void;
 cache?: PerfCache;
 random?: () => number;
 runtime?: ShrRuntime;
 idleDelay?: number;
 containerBridge?: BridgeLike;
 metadata?: PerfPluginMetadata;
}

export interface ShrRuntime {
 addEventListener: (
  type: "scroll",
  listener: (event?: { target?: unknown }) => void,
  options?: AddEventListenerOptions,
 ) => void;
 removeEventListener: (
  type: "scroll",
  listener: (event?: { target?: unknown }) => void,
 ) => void;
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

   const metadata = createPerfMetadata({
    project: context.cfgManager.getConfig("project"),
    ...options.metadata,
   });
   manager = new ShrManager({
    send: context.transport.send.bind(context.transport),
    endpoint: perf.shr.endpoint,
    project: metadata.project,
    pagePath: metadata.pagePath,
    metadata,
    sample: perf.shr.sample,
    timeout: perf.shr.timeout,
    tags: perf.shr.customTags,
    cache: options.cache,
    random: options.random,
    containerBridge: options.containerBridge,
   });
   options.onReady?.(manager);
   stopWatch = watchScrollRuntime(
    manager,
    options.runtime,
    options.idleDelay,
   );
  },
  stop() {
   stopWatch?.();
   stopWatch = undefined;
   manager = undefined;
  },
 };
}

export function calculateScrollMetrics(
 input: ScrollMetricsInput,
 costMs = 0,
): ScrollMetrics {
 const duration = Math.max(0, input.endTime - input.startTime);
 const frames = input.frameTimes.length;
 const frameTimeDiff = calculateFrameTimeDiff(input.frameTimes);
 return {
  duration,
  frames,
  fps: duration > 0 ? Math.round((frames * 1000) / duration) : 0,
  frameDropRate:
   duration > 0 ? Math.round((frameTimeDiff / duration) * 1000) : 0,
  costMs,
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

function compactRecord(
 input: Record<string, unknown>,
): Record<string, string | number | boolean> {
 const output: Record<string, string | number | boolean> = {};
 for (const [key, value] of Object.entries(input)) {
  if (
   typeof value === "string" ||
   typeof value === "number" ||
   typeof value === "boolean"
  ) {
   output[key] = value;
  }
 }
 return output;
}

function watchScrollRuntime(
 manager: ShrManager,
 runtime = getRuntime(),
 idleDelay = 150,
): (() => void) | undefined {
 if (!runtime) {
  return undefined;
 }

 const state = createScrollState(manager, runtime, idleDelay);
 runtime.addEventListener("scroll", state.onScroll, { capture: true });
 return () => {
  state.stop();
  runtime.removeEventListener("scroll", state.onScroll);
 };
}

function createScrollState(
 manager: ShrManager,
 runtime: ShrRuntime,
 idleDelay: number,
) {
 const frameTimes: number[] = [];
 let startTime = 0;
 let lastScrollValue = 0;
 let lastScrollChangeTime = runtime.now();
 let animationFrameId: number | undefined;
 let isScrolling = false;
 let scrollTarget: unknown;
 let timeCost = 0;
 const stop = () => {
  if (animationFrameId !== undefined) {
   runtime.cancelAnimationFrame?.(animationFrameId);
   animationFrameId = undefined;
  }
 };
 const onScroll = (event?: { target?: unknown }) => {
  const costStart = runtime.now();
  try {
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
    logger.log(
     `滑动开始上报 ${JSON.stringify({ scrollStartTime: startTime, scrollEndTime: 0 })}`,
    );
    startTracking();
   }
  } catch (error) {
   logger.error("scroll error", error);
  } finally {
   timeCost += runtime.now() - costStart;
  }
 };
 const startTracking = () => {
  if (animationFrameId !== undefined) {
   return;
  }
  logger.log("开始跟踪滚动");
  animationFrameId = runtime.requestAnimationFrame(trackFrame);
 };
 const trackFrame = (time: number) => {
  const costStart = runtime.now();
  try {
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
    const scrollDuration = endTime - startTime;
    logger.log(
     `滑动结束上报 ${JSON.stringify({ scrollStartTime: startTime, scrollEndTime: endTime })}, ` +
      `本次滑动时长: ${scrollDuration}ms, ` +
      `本次滑动帧数: ${frameTimes.length}`,
    );
    void manager.report(
     { startTime, endTime, frameTimes: [...frameTimes] },
     Math.round(timeCost),
    );
    isScrolling = false;
    scrollTarget = undefined;
    frameTimes.length = 0;
    timeCost = 0;
    return;
   }
   if (isScrolling) {
    animationFrameId = runtime.requestAnimationFrame(trackFrame);
   }
  } catch (error) {
   logger.error("trackFrame error:", error);
  } finally {
   timeCost += runtime.now() - costStart;
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
   if (
    !target ||
    target === document ||
    target === document.documentElement
   ) {
    return window.scrollY || document.documentElement.scrollTop;
   }
   return typeof (target as { scrollTop?: unknown }).scrollTop === "number"
    ? (target as { scrollTop: number }).scrollTop
    : 0;
  },
 };
}

function getScrollValue(runtime: ShrRuntime, target: unknown): number {
 return runtime.getScrollValue?.(target) ?? 0;
}

function reportWithContainerBridge(
 bridge: BridgeLike,
 event: Record<string, unknown>,
): Promise<void> {
 const method = bridge["shr.sendScrollStateTime"];
 if (typeof method !== "function") {
  return Promise.resolve();
 }
 return new Promise((resolve, reject) => {
  (
   method as (
    event: Record<string, unknown>,
    callbacks: BridgeCallbacks,
   ) => void
  )(event, {
   success: () => resolve(),
   fail: (error) =>
    reject(error instanceof Error ? error : new Error("shr bridge failed")),
  });
 });
}
