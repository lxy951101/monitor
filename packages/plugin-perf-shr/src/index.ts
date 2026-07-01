import type { MonitorContext, Plugin } from "@monitor/core";
import { PerfCache, sendWithPerfCache } from "@monitor/plugin-perf-cache";
import { createPerfCustomPayload, type PerfLog } from "@monitor/protocol";
import type { TransportRequest, TransportResponse } from "@monitor/transport";

export const packageName = "@monitor/plugin-perf-shr";

const FRAME_BUDGET = 16.7;
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
  droppedFrames: number;
  droppedRate: number;
}

export interface ShrManagerOptions {
  send: SendFn;
  endpoint: string;
  sample?: number;
  timeout?: number;
  tags?: Record<string, string>;
  cache?: PerfCache;
  random?: () => number;
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

    await sendWithPerfCache(this.createRequest(calculateScrollMetrics(input)), this.options.send, this.options.cache);
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
}

export interface ShrPluginOptions {
  onReady?: (manager: ShrManager) => void;
  cache?: PerfCache;
  random?: () => number;
  runtime?: ShrRuntime;
  idleDelay?: number;
}

export interface ShrRuntime {
  addEventListener: (type: "scroll", listener: () => void) => void;
  removeEventListener: (type: "scroll", listener: () => void) => void;
  requestAnimationFrame: (callback: (time: number) => void) => number;
  setTimeout: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  clearTimeout: (timer: ReturnType<typeof setTimeout>) => void;
  now: () => number;
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
        sample: perf.shr.sample,
        timeout: perf.shr.timeout,
        tags: perf.shr.customTags,
        cache: options.cache,
        random: options.random
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
  const droppedFrames = countDroppedFrames(input.frameTimes);
  return {
    duration,
    frames,
    fps: duration > 0 ? Math.round((frames * 1000) / duration) : 0,
    droppedFrames,
    droppedRate: frames > 0 ? droppedFrames / frames : 0
  };
}

function countDroppedFrames(frameTimes: number[]): number {
  let dropped = 0;
  for (let index = 1; index < frameTimes.length; index += 1) {
    const gap = frameTimes[index] - frameTimes[index - 1];
    dropped += Math.max(0, Math.round(gap / FRAME_BUDGET) - 1);
  }
  return dropped;
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
  let startTime: number | undefined;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  const captureFrame = (time: number) => frameTimes.push(time);
  const stop = () => {
    if (idleTimer) {
      runtime.clearTimeout(idleTimer);
      idleTimer = undefined;
    }
  };
  const onScroll = () => {
    startTime ??= runtime.now();
    runtime.requestAnimationFrame(captureFrame);
    stop();
    idleTimer = runtime.setTimeout(() => {
      void manager.report({ startTime: startTime ?? runtime.now(), endTime: runtime.now(), frameTimes: [...frameTimes] });
      startTime = undefined;
      frameTimes.length = 0;
    }, idleDelay);
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
    setTimeout,
    clearTimeout,
    now: performance.now.bind(performance)
  };
}
