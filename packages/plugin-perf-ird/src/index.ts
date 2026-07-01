import type { MonitorContext, Plugin } from "@monitor/core";
import { PerfCache, sendWithPerfCache } from "@monitor/plugin-perf-cache";
import { createPerfCustomPayload, type PerfLog } from "@monitor/protocol";
import type { TransportRequest, TransportResponse } from "@monitor/transport";

export const packageName = "@monitor/plugin-perf-ird";

type SendFn = (request: TransportRequest) => Promise<TransportResponse | void>;

export interface IrdManagerOptions {
  send: SendFn;
  endpoint: string;
  sample?: number;
  timeout?: number;
  tags?: Record<string, string>;
  cache?: PerfCache;
  random?: () => number;
}

export class IrdManager {
  private readonly options: IrdManagerOptions;
  private touchEndTime: number | undefined;

  constructor(options: IrdManagerOptions) {
    this.options = options;
  }

  recordTouchEnd(time: number): void {
    this.touchEndTime = time;
  }

  async recordNextFrame(time: number): Promise<void> {
    if (this.touchEndTime === undefined || !isSampled(this.options.sample, this.options.random)) {
      return;
    }

    const delay = calculateInteractionDelay(this.touchEndTime, time);
    this.touchEndTime = undefined;
    await this.report({ delay, touchEnd: time - delay, nextFrame: time });
  }

  async report(metrics: PerfLog): Promise<void> {
    await sendWithPerfCache(this.createRequest(metrics), this.options.send, this.options.cache);
  }

  private createRequest(metrics: PerfLog): TransportRequest {
    return {
      method: "POST",
      url: this.options.endpoint,
      timeout: this.options.timeout,
      body: JSON.stringify(createPerfCustomPayload({
        category: "ird_web",
        env: this.options.tags,
        metrics
      })),
      headers: {
        "content-type": "application/json;charset=UTF-8"
      }
    };
  }
}

export interface IrdPluginOptions {
  onReady?: (manager: IrdManager) => void;
  cache?: PerfCache;
  random?: () => number;
  runtime?: IrdRuntime;
}

export interface IrdRuntime {
  addEventListener: (type: "touchend", listener: () => void) => void;
  removeEventListener: (type: "touchend", listener: () => void) => void;
  requestAnimationFrame: (callback: (time: number) => void) => number;
  now: () => number;
}

export function createIrdPlugin(options: IrdPluginOptions = {}): Plugin {
  let manager: IrdManager | undefined;
  let stopWatch: (() => void) | undefined;
  return {
    name: packageName,
    start(context: MonitorContext) {
      const perf = context.cfgManager.getConfig("perf");
      if (!perf.enable || !perf.ird.enable) {
        return;
      }

      manager = new IrdManager({
        send: context.transport.send.bind(context.transport),
        endpoint: perf.ird.endpoint,
        sample: perf.ird.sample,
        timeout: perf.ird.timeout,
        tags: perf.ird.customTags,
        cache: options.cache,
        random: options.random
      });
      options.onReady?.(manager);
      stopWatch = watchInteractionRuntime(manager, options.runtime);
    },
    stop() {
      stopWatch?.();
      stopWatch = undefined;
      manager = undefined;
    }
  };
}

export function calculateInteractionDelay(touchEndTime: number, nextFrameTime: number): number {
  return Math.max(0, nextFrameTime - touchEndTime);
}

function isSampled(sample = 1, random: () => number = Math.random): boolean {
  return sample >= 1 || random() < sample;
}

function watchInteractionRuntime(manager: IrdManager, runtime = getRuntime()): (() => void) | undefined {
  if (!runtime) {
    return undefined;
  }

  const onTouchEnd = () => {
    manager.recordTouchEnd(runtime.now());
    runtime.requestAnimationFrame((time) => {
      void manager.recordNextFrame(time);
    });
  };
  runtime.addEventListener("touchend", onTouchEnd);
  return () => runtime.removeEventListener("touchend", onTouchEnd);
}

function getRuntime(): IrdRuntime | undefined {
  if (typeof window === "undefined" || typeof performance === "undefined") {
    return undefined;
  }

  return {
    addEventListener: window.addEventListener.bind(window),
    removeEventListener: window.removeEventListener.bind(window),
    requestAnimationFrame: window.requestAnimationFrame.bind(window),
    now: performance.now.bind(performance)
  };
}
