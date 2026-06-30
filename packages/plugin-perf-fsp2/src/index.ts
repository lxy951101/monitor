import type { MonitorContext, Plugin } from "@monitor/core";
import { PerfCache, sendWithPerfCache } from "@monitor/plugin-perf-cache";
import { createPerfCustomPayload, type PerfLog } from "@monitor/protocol";
import type { TransportRequest, TransportResponse } from "@monitor/transport";

export const packageName = "@monitor/plugin-perf-fsp2";

type SendFn = (request: TransportRequest) => Promise<TransportResponse | void>;
export type Fsp2Status = "success" | "timeout" | "hidden";
export type BeforeSendFsp2 = (metrics: Fsp2Metrics) => Fsp2Metrics | false | void;

export interface Fsp2Input {
  startTime: number;
  firstScreenTime?: number;
  now: number;
  timeout: number;
  hidden?: boolean;
}

export interface Fsp2Metrics extends PerfLog {
  status: Fsp2Status;
  duration: number;
}

export interface Fsp2ManagerOptions {
  send: SendFn;
  endpoint: string;
  sample?: number;
  timeout?: number;
  tags?: Record<string, string>;
  cache?: PerfCache;
  random?: () => number;
  now?: () => number;
  beforeSend?: BeforeSendFsp2;
}

export class Fsp2Manager {
  private readonly options: Fsp2ManagerOptions;
  private readonly startTime: number;
  private hidden = false;
  private reported = false;

  constructor(options: Fsp2ManagerOptions) {
    this.options = options;
    this.startTime = options.now?.() ?? Date.now();
  }

  markHidden(): void {
    this.hidden = true;
  }

  async report(firstScreenTime?: number): Promise<void> {
    if (this.reported) {
      return;
    }

    if (!isSampled(this.options.sample, this.options.random)) {
      this.reported = true;
      return;
    }

    const metrics = calculateFsp2({
      startTime: this.startTime,
      firstScreenTime,
      now: this.options.now?.() ?? Date.now(),
      timeout: this.options.timeout ?? 10000,
      hidden: this.hidden
    });
    const next = this.options.beforeSend?.(metrics);
    if (next === false) {
      this.reported = true;
      return;
    }

    this.reported = true;
    await sendWithPerfCache(this.createRequest(next ?? metrics), this.options.send, this.options.cache);
  }

  private createRequest(metrics: Fsp2Metrics): TransportRequest {
    return {
      method: "POST",
      url: this.options.endpoint,
      timeout: this.options.timeout,
      body: JSON.stringify(createPerfCustomPayload({
        category: "fsp2_web",
        env: this.options.tags,
        metrics
      })),
      headers: {
        "content-type": "application/json;charset=UTF-8"
      }
    };
  }
}

export interface Fsp2PluginOptions {
  onReady?: (manager: Fsp2Manager) => void;
  cache?: PerfCache;
  random?: () => number;
  now?: () => number;
  beforeSend?: BeforeSendFsp2;
  runtime?: Fsp2Runtime;
}

export interface Fsp2Runtime {
  document?: { visibilityState?: string };
  addEventListener: (type: "visibilitychange", listener: () => void) => void;
  removeEventListener: (type: "visibilitychange", listener: () => void) => void;
  setTimeout: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  clearTimeout: (timer: ReturnType<typeof setTimeout>) => void;
}

export function createFsp2Plugin(options: Fsp2PluginOptions = {}): Plugin {
  let manager: Fsp2Manager | undefined;
  let stopWatch: (() => void) | undefined;
  return {
    name: packageName,
    start(context: MonitorContext) {
      const perf = context.cfgManager.getConfig("perf");
      if (!perf.enable || !perf.fsp2.enable) {
        return;
      }

      manager = new Fsp2Manager({
        send: context.transport.send.bind(context.transport),
        endpoint: perf.fsp2.endpoint,
        sample: perf.fsp2.sample,
        timeout: perf.fsp2.timeout,
        tags: perf.fsp2.customTags,
        cache: options.cache,
        random: options.random,
        now: options.now,
        beforeSend: options.beforeSend
      });
      options.onReady?.(manager);
      stopWatch = watchFsp2Runtime(manager, perf.fsp2.timeout, options.runtime);
    },
    stop() {
      stopWatch?.();
      stopWatch = undefined;
      manager = undefined;
    }
  };
}

export function calculateFsp2(input: Fsp2Input): Fsp2Metrics {
  if (input.hidden) {
    return { status: "hidden", duration: Math.max(0, input.now - input.startTime) };
  }

  const endTime = input.firstScreenTime ?? input.now;
  const duration = Math.max(0, endTime - input.startTime);
  return {
    status: duration > input.timeout ? "timeout" : "success",
    duration
  };
}

function isSampled(sample = 1, random: () => number = Math.random): boolean {
  return sample >= 1 || random() < sample;
}

function watchFsp2Runtime(manager: Fsp2Manager, timeout: number, runtime = getRuntime()): (() => void) | undefined {
  if (!runtime) {
    return undefined;
  }

  const onVisibilityChange = () => {
    if (runtime.document?.visibilityState === "hidden") {
      manager.markHidden();
    }
  };
  const timer = runtime.setTimeout(() => {
    void manager.report();
  }, timeout);
  runtime.addEventListener("visibilitychange", onVisibilityChange);
  return () => {
    runtime.clearTimeout(timer);
    runtime.removeEventListener("visibilitychange", onVisibilityChange);
  };
}

function getRuntime(): Fsp2Runtime | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return {
    document,
    addEventListener: window.addEventListener.bind(window),
    removeEventListener: window.removeEventListener.bind(window),
    setTimeout,
    clearTimeout
  };
}
