import {
  createPerfMetadata,
  type ConsoleLike,
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

export const packageName = "@monitor/plugin-perf-ird";

type SendFn = (request: TransportRequest) => Promise<TransportResponse | void>;

export interface IrdManagerOptions {
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
  logger?: ConsoleLike;
}

export class IrdManager {
  private readonly options: IrdManagerOptions;
  private touchEndTime: number | undefined;

  constructor(options: IrdManagerOptions) {
    this.options = options;
    options.logger?.log("[ird] config", {
      sample: options.sample,
      timeout: options.timeout,
      endpoint: options.endpoint,
      project: options.project,
    });
  }

  recordTouchEnd(time: number): void {
    this.touchEndTime = time;
  }

  async recordNextFrame(time: number): Promise<void> {
    if (this.touchEndTime === undefined || !isSampled(this.options.sample, this.options.random)) {
      return;
    }

    const delay = calculateInteractionDelay(this.touchEndTime, time);
    this.options.logger?.log("[ird] 交互响应时间:", delay);
    this.touchEndTime = undefined;
    await this.report({ delay, touchEnd: time - delay, nextFrame: time });
  }

  async recordTimeout(): Promise<void> {
    this.options.logger?.log("[ird] 交互响应超时");
    this.touchEndTime = undefined;
    await this.report({ delay: this.options.timeout ?? 3000, timeout: true });
  }

  async report(metrics: PerfLog): Promise<void> {
    if (this.options.containerBridge) {
      await reportWithContainerBridge(
        this.options.containerBridge,
        this.createBridgeEvent(metrics),
        this.options.logger,
      );
      return;
    }
    await sendWithPerfCache(this.createRequest(metrics), this.options.send, this.options.cache);
  }

  private createRequest(metrics: PerfLog): TransportRequest {
    return {
      method: "POST",
      url: this.options.endpoint,
      timeout: this.options.timeout,
      body: JSON.stringify(
        createPerfCustomPayload({
          category: "ird_web",
          env: this.createEnv(),
          metrics,
        }),
      ),
      headers: {
        "content-type": "application/json;charset=UTF-8",
      },
    };
  }

  private createBridgeEvent(metrics: PerfLog): Record<string, unknown> {
    const delay = Number(metrics.delay ?? 0);
    return {
      pagePath: this.options.pagePath ?? "",
      techStack: "container",
      value: delay,
      tags: {
        ...this.createEnv(),
        $sr: Math.min(this.options.sample ?? 1, 1),
        gatherSource: "js",
        appId: this.options.project ?? "",
      },
    };
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

export interface IrdPluginOptions {
  onReady?: (manager: IrdManager) => void;
  cache?: PerfCache;
  random?: () => number;
  runtime?: IrdRuntime;
  containerBridge?: BridgeLike;
  metadata?: PerfPluginMetadata;
  logger?: ConsoleLike;
}

export interface IrdRuntime {
  addEventListener: (
    type: "touchend",
    listener: () => void,
    options?: AddEventListenerOptions,
  ) => void;
  removeEventListener: (type: "touchend", listener: () => void) => void;
  requestAnimationFrame: (callback: (time: number) => void) => number;
  cancelAnimationFrame?: (id: number) => void;
  setTimeout: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  clearTimeout: (timer: ReturnType<typeof setTimeout>) => void;
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

      const metadata = createPerfMetadata({
        project: context.cfgManager.getConfig("project"),
        ...options.metadata,
      });
      manager = new IrdManager({
        send: context.transport.send.bind(context.transport),
        endpoint: perf.ird.endpoint,
        project: context.cfgManager.getConfig("project"),
        pagePath: metadata.pagePath,
        metadata,
        sample: perf.ird.sample,
        timeout: perf.ird.timeout,
        tags: perf.ird.customTags,
        cache: options.cache,
        random: options.random,
        containerBridge: options.containerBridge,
        logger: options.logger,
      });
      options.onReady?.(manager);
      stopWatch = watchInteractionRuntime(
        manager,
        options.runtime,
        perf.ird.timeout,
        options.logger,
      );
    },
    stop() {
      stopWatch?.();
      stopWatch = undefined;
      manager = undefined;
    },
  };
}

export function calculateInteractionDelay(touchEndTime: number, nextFrameTime: number): number {
  return Math.max(0, nextFrameTime - touchEndTime);
}

function isSampled(sample = 1, random: () => number = Math.random): boolean {
  return sample >= 1 || random() < sample;
}

function compactRecord(input: Record<string, unknown>): Record<string, string | number | boolean> {
  const output: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      output[key] = value;
    }
  }
  return output;
}

function watchInteractionRuntime(
  manager: IrdManager,
  runtime = getRuntime(),
  timeoutMs = 3000,
  logger?: ConsoleLike,
): (() => void) | undefined {
  if (!runtime) {
    return undefined;
  }

  logger?.log("[ird] observer --功能开启");

  const onTouchEnd = () => {
    try {
      manager.recordTouchEnd(runtime.now());
      let rafId: number | undefined;
      let finished = false;
      const timeout = runtime.setTimeout(() => {
        if (finished) {
          return;
        }
        finished = true;
        if (rafId !== undefined) {
          runtime.cancelAnimationFrame?.(rafId);
        }
        void manager.recordTimeout();
      }, timeoutMs);
      rafId = runtime.requestAnimationFrame((time) => {
        if (finished) {
          return;
        }
        finished = true;
        runtime.clearTimeout(timeout);
        void manager.recordNextFrame(time);
      });
    } catch (e) {
      logger?.log("[ird] handleTouchEnd observer error:", e);
    }
  };
  runtime.addEventListener("touchend", onTouchEnd, { capture: true });
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
    cancelAnimationFrame: window.cancelAnimationFrame?.bind(window),
    setTimeout,
    clearTimeout,
    now: performance.now.bind(performance),
  };
}

function reportWithContainerBridge(
  bridge: BridgeLike,
  event: Record<string, unknown>,
  logger?: ConsoleLike,
): Promise<void> {
  const method = bridge["ird.record"];
  if (typeof method !== "function") {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    (method as (event: Record<string, unknown>, callbacks: BridgeCallbacks) => void)(event, {
      success: (result) => {
        logger?.log("ird report result", result);
        resolve();
      },
      fail: (error) => {
        logger?.log("ird report error:", error);
        reject(error instanceof Error ? error : new Error("ird bridge failed"));
      },
    });
  });
}
