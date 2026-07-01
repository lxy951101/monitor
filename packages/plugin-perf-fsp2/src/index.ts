import type { MonitorContext, Plugin } from "@monitor/core";
import { PerfCache, sendWithPerfCache } from "@monitor/plugin-perf-cache";
import { createFsp2BridgeEvent, createPerfCustomPayload, type PerfLog } from "@monitor/protocol";
import {
  createContainerBridgeReporter,
  type BridgeLike,
  type ContainerBridgeReporter,
  type TransportRequest,
  type TransportResponse
} from "@monitor/transport";
import type { Fsp2DetectorSnapshot } from "./fsp2-detector";
import { watchFsp2Runtime, type Fsp2Runtime } from "./fsp2-runtime";

export const packageName = "@monitor/plugin-perf-fsp2";

type SendFn = (request: TransportRequest) => Promise<TransportResponse | void>;
export type Fsp2Status = "start" | "success" | "timeout" | "hidden" | "interact" | "notsupport" | "error";
export type BeforeSendFsp2 = (metrics: Fsp2Metrics) => Fsp2Metrics | false | void;

export interface Fsp2Input {
  startTime: number;
  firstScreenTime?: number;
  now: number;
  timeout: number;
  hidden?: boolean;
  status?: Fsp2Status;
  detector?: Fsp2DetectorSnapshot;
  mutationCount?: number;
  cls?: Fsp2ClsMetrics;
  costMs?: number;
}

export interface Fsp2ClsMetrics {
  pageLoadedTime: number;
  pageStable: boolean;
  loadedStableGap: number;
}

export interface Fsp2Metrics extends PerfLog {
  status: Fsp2Status;
  duration: number;
}

export interface Fsp2ReportInput {
  status?: Fsp2Status;
  timestamp?: number;
  detector?: Fsp2DetectorSnapshot;
  mutationCount?: number;
  cls?: Fsp2ClsMetrics;
  costMs?: number;
}

export interface Fsp2ManagerOptions {
  send: SendFn;
  endpoint: string;
  project?: string;
  pagePath?: string;
  pageUrl?: string;
  userAgent?: string;
  sdkVersion?: string;
  pageNavStart?: number;
  isOffline?: boolean;
  sample?: number;
  timeout?: number;
  tags?: Record<string, string>;
  cache?: PerfCache;
  random?: () => number;
  now?: () => number;
  beforeSend?: BeforeSendFsp2;
  containerBridge?: ContainerBridgeReporter;
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

  async report(input?: number | Fsp2ReportInput, detector?: Fsp2DetectorSnapshot, mutationCount = 0): Promise<void> {
    if (this.reported) {
      return;
    }
    if (!isSampled(this.options.sample, this.options.random)) {
      this.reported = true;
      return;
    }

    const reportInput = normalizeReportInput(input, detector, mutationCount);
    const metrics = calculateFsp2({
      startTime: this.startTime,
      firstScreenTime: reportInput.timestamp,
      now: this.options.now?.() ?? Date.now(),
      timeout: this.options.timeout ?? 10000,
      hidden: this.hidden,
      status: reportInput.status,
      detector: reportInput.detector,
      mutationCount: reportInput.mutationCount,
      cls: reportInput.cls,
      costMs: reportInput.costMs
    });
    const next = this.options.beforeSend?.(metrics);
    if (next === false) {
      this.reported = true;
      return;
    }

    this.reported = true;
    const finalMetrics = next ?? metrics;
    if (this.options.containerBridge) {
      await this.options.containerBridge.reportFsp2(this.createBridgeEvent(finalMetrics, reportInput));
      return;
    }
    await sendWithPerfCache(this.createRequest(finalMetrics), this.options.send, this.options.cache);
  }

  async reportLifecycle(status: Fsp2Status, timestamp?: number, costMs = 0): Promise<void> {
    if (!this.options.containerBridge) {
      return;
    }
    await this.options.containerBridge.reportFsp2(this.createBridgeEvent({
      status,
      duration: Math.max(0, (timestamp ?? this.options.now?.() ?? Date.now()) - this.startTime),
      renderRate: 0,
      reachBottom: "notReached",
      mutationCount: 0,
      costMs
    }, { status, timestamp, costMs }));
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

  private createBridgeEvent(metrics: Fsp2Metrics, input: Fsp2ReportInput): Record<string, unknown> {
    return createFsp2BridgeEvent({
      type: metrics.status,
      createMs: input.timestamp ?? this.options.now?.() ?? Date.now(),
      appId: this.options.project ?? "",
      pagePath: this.options.pagePath,
      pageUrl: this.options.pageUrl,
      userAgent: this.options.userAgent,
      sdkVersion: this.options.sdkVersion,
      pageNavStart: this.options.pageNavStart,
      isOffline: this.options.isOffline,
      sampleRate: this.options.sample,
      tags: this.options.tags,
      metrics: {
        reachBottom: metrics.reachBottom === "reached",
        renderRate: Number(metrics.renderRate ?? 0),
        mutationCount: Number(metrics.mutationCount ?? 0),
        costMs: Number(metrics.costMs ?? 0),
        pageLoadedTime: input.cls?.pageLoadedTime,
        pageStable: input.cls?.pageStable,
        loadedStableGap: input.cls?.loadedStableGap
      }
    });
  }
}

export interface Fsp2PluginOptions {
  onReady?: (manager: Fsp2Manager) => void;
  cache?: PerfCache;
  random?: () => number;
  now?: () => number;
  beforeSend?: BeforeSendFsp2;
  runtime?: Fsp2Runtime;
  containerBridge?: BridgeLike;
  metadata?: Fsp2Metadata;
}

export interface Fsp2Metadata {
  pagePath?: string;
  pageUrl?: string;
  userAgent?: string;
  sdkVersion?: string;
  pageNavStart?: number;
  isOffline?: boolean;
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

      const bridgeConfig = context.cfgManager.getConfig("bridge");
      const metadata = resolveFsp2Metadata(options);
      manager = new Fsp2Manager({
        send: context.transport.send.bind(context.transport),
        endpoint: perf.fsp2.endpoint,
        project: context.cfgManager.getConfig("project"),
        ...metadata,
        sample: perf.fsp2.sample,
        timeout: perf.fsp2.timeout,
        tags: perf.fsp2.customTags,
        cache: options.cache,
        random: options.random,
        now: options.now,
        beforeSend: options.beforeSend,
        containerBridge: createFsp2ContainerBridge(options, bridgeConfig.useMSI)
      });
      options.onReady?.(manager);
      stopWatch = watchFsp2Runtime(manager, {
        timeout: perf.fsp2.timeout,
        useIgnore: Boolean(perf.fsp2.useIgnore),
        fspClsEnable: perf.fsp2.fspClsEnable !== false,
        defer: perf.fsp2.defer !== false,
        runtime: options.runtime,
        now: options.now
      });
    },
    stop() {
      stopWatch?.();
      stopWatch = undefined;
      manager = undefined;
    }
  };
}

export function calculateFsp2(input: Fsp2Input): Fsp2Metrics {
  const detectorMetrics = createDetectorMetrics(input.detector, input.mutationCount, input.cls, input.costMs);
  if (input.hidden) {
    return {
      status: "hidden",
      duration: Math.max(0, input.now - input.startTime),
      ...detectorMetrics
    };
  }

  const endTime = input.firstScreenTime ?? input.now;
  const duration = Math.max(0, endTime - input.startTime);
  return {
    status: input.status ?? (duration > input.timeout ? "timeout" : "success"),
    duration,
    ...detectorMetrics
  };
}

function normalizeReportInput(input?: number | Fsp2ReportInput, detector?: Fsp2DetectorSnapshot, mutationCount = 0): Fsp2ReportInput {
  if (typeof input === "number") {
    return { timestamp: input, detector, mutationCount };
  }
  return input ?? {};
}

function createDetectorMetrics(
  detector?: Fsp2DetectorSnapshot,
  mutationCount = 0,
  cls?: Fsp2ClsMetrics,
  costMs?: number
): PerfLog {
  const metrics: PerfLog = {};
  if (detector) {
    metrics.renderRate = detector.renderRate;
    metrics.reachBottom = detector.reachBottomDone ? "reached" : "notReached";
    metrics.mutationCount = mutationCount;
  }
  if (cls) {
    metrics.detect_cls = true;
    metrics.ffp_page_loaded = Boolean(detector?.fillRateDone && detector.reachBottomDone);
    metrics.ffp_loaded_time = cls.pageLoadedTime;
    metrics.ffp_page_stable = cls.pageStable;
    metrics.ffp_loaded_stable_gap = cls.loadedStableGap;
  }
  if (typeof costMs === "number") {
    metrics.costMs = costMs;
  }
  return metrics;
}

function isSampled(sample = 1, random: () => number = Math.random): boolean {
  return sample >= 1 || random() < sample;
}

function createFsp2ContainerBridge(options: Fsp2PluginOptions, preferMSI: boolean): ContainerBridgeReporter | undefined {
  const bridge = options.containerBridge ?? options.runtime?.containerBridge ?? getGlobalContainerBridge();
  if (!bridge) {
    return undefined;
  }
  return createContainerBridgeReporter({
    bridge,
    preferMSI
  });
}

function resolveFsp2Metadata(options: Fsp2PluginOptions): Fsp2Metadata {
  const runtime = options.runtime ?? getBrowserRuntimeMetadata();
  return {
    pagePath: runtime?.location?.pathname,
    pageUrl: runtime?.location?.href,
    userAgent: runtime?.navigator?.userAgent,
    pageNavStart: runtime?.performance?.timing?.navigationStart ?? runtime?.performance?.timeOrigin,
    isOffline: typeof runtime?.navigator?.onLine === "boolean" ? !runtime.navigator.onLine : undefined,
    ...options.metadata
  };
}

function getBrowserRuntimeMetadata(): Fsp2Runtime | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return {
    location: window.location,
    navigator: window.navigator,
    performance: window.performance,
    containerBridge: getGlobalContainerBridge(),
    addEventListener: window.addEventListener.bind(window),
    removeEventListener: window.removeEventListener.bind(window),
    setTimeout,
    clearTimeout
  };
}

function getGlobalContainerBridge(): BridgeLike | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  const scope = window as unknown as Record<string, unknown>;
  for (const key of ["MSI", "msi", "KNB", "NativeBridge", "bridge"]) {
    const bridge = scope[key];
    if (bridge && typeof bridge === "object") {
      return bridge as BridgeLike;
    }
  }
  return undefined;
}
