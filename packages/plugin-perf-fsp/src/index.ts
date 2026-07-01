import { createPerfMetadata, type MonitorContext, type PerfMetadata, type PerfRunEnv, type Plugin } from "@monitor/core";
import { PerfCache, sendWithPerfCache } from "@monitor/plugin-perf-cache";
import { createFspBridgeEvent, createPerfCustomPayload, type PerfLog } from "@monitor/protocol";
import {
 createContainerBridgeReporter,
 type BridgeLike,
 type ContainerBridgeReporter,
 type TransportRequest,
 type TransportResponse
} from "@monitor/transport";
import type { FspDetectorSnapshot } from "./fsp-detector";
import { watchFspRuntime, type FspRuntime } from "./fsp-runtime";

export const packageName = "@monitor/plugin-perf-fsp";

type SendFn = (request: TransportRequest) => Promise<TransportResponse | void>;
export type FspStatus = "start" | "success" | "timeout" | "hidden" | "interact" | "notsupport" | "error";
export type BeforeSendFsp = (metrics: FspMetrics) => FspMetrics | false | void;

export interface FspInput {
 startTime: number;
 firstScreenTime?: number;
 now: number;
 timeout: number;
 hidden?: boolean;
 status?: FspStatus;
 detector?: FspDetectorSnapshot;
 mutationCount?: number;
 cls?: FspClsMetrics;
 costMs?: number;
}

export interface FspClsMetrics {
 pageLoadedTime: number;
 pageStable: boolean;
 loadedStableGap: number;
 calibrateEndType?: FspStatus;
 clsCycleLength?: number;
 clsCycleNum?: number;
 clsCycleThreshold?: number;
}

export interface FspMetrics extends PerfLog {
 status: FspStatus;
 duration: number;
}

export interface FspReportInput {
 status?: FspStatus;
 timestamp?: number;
 detector?: FspDetectorSnapshot;
 mutationCount?: number;
 cls?: FspClsMetrics;
 costMs?: number;
}

export interface FspManagerOptions {
 send: SendFn;
 endpoint: string;
 project?: string;
 pagePath?: string;
 pageUrl?: string;
 userAgent?: string;
 sdkVersion?: string;
 pageNavStart?: number;
 isOffline?: boolean;
 runEnv?: PerfRunEnv;
 biz?: string;
 screen?: string;
 version?: string;
 visitId?: string;
 networkType?: string;
 uuid?: string;
 containerVersion?: string;
 sample?: number;
 timeout?: number;
 tags?: Record<string, string>;
 cache?: PerfCache;
 random?: () => number;
 now?: () => number;
 beforeSend?: BeforeSendFsp;
 containerBridge?: ContainerBridgeReporter;
}

export class FspManager {
 private readonly options: FspManagerOptions;
 private readonly startTime: number;
 private hidden = false;
 private reported = false;

 constructor(options: FspManagerOptions) {
  this.options = options;
  this.startTime = options.now?.() ?? Date.now();
 }

 markHidden(): void {
  this.hidden = true;
 }

 async report(input?: number | FspReportInput, detector?: FspDetectorSnapshot, mutationCount = 0): Promise<void> {
  if (this.reported) {
   return;
  }
  if (!isSampled(this.options.sample, this.options.random)) {
   this.reported = true;
   return;
  }

  const reportInput = normalizeReportInput(input, detector, mutationCount);
  const metrics = calculateFsp({
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
   await this.options.containerBridge.reportFsp(this.createBridgeEvent(finalMetrics, reportInput));
   return;
  }
  await sendWithPerfCache(this.createRequest(finalMetrics), this.options.send, this.options.cache);
 }

 async reportLifecycle(status: FspStatus, timestamp?: number, costMs = 0): Promise<void> {
  if (!this.options.containerBridge) {
   return;
  }
  await this.options.containerBridge.reportFsp(this.createBridgeEvent({
   status,
   duration: Math.max(0, (timestamp ?? this.options.now?.() ?? Date.now()) - this.startTime),
   renderRate: 0,
   reachBottom: "notReached",
   mutationCount: 0,
   costMs
  }, { status, timestamp, costMs }));
 }

 private createRequest(metrics: FspMetrics): TransportRequest {
  return {
   method: "POST",
   url: this.options.endpoint,
   timeout: this.options.timeout,
   body: JSON.stringify(createPerfCustomPayload({
    category: "fsp_web",
    env: this.createEnv(),
    metrics
   })),
   headers: {
    "content-type": "application/json;charset=UTF-8"
   }
  };
 }

 private createBridgeEvent(metrics: FspMetrics, input: FspReportInput): Record<string, unknown> {
  return createFspBridgeEvent({
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
   tags: this.createEnv(),
   metrics: {
    reachBottom: metrics.reachBottom === "reached",
    renderRate: Number(metrics.renderRate ?? 0),
    mutationCount: Number(metrics.mutationCount ?? 0),
    costMs: Number(metrics.costMs ?? 0),
    calibrateEndType: input.cls?.calibrateEndType,
    clsCycleLength: input.cls?.clsCycleLength,
    clsCycleNum: input.cls?.clsCycleNum,
    clsCycleThreshold: input.cls?.clsCycleThreshold,
    pageLoadedTime: input.cls?.pageLoadedTime,
    pageStable: input.cls?.pageStable,
    loadedStableGap: input.cls?.loadedStableGap
   }
  });
 }

 private createEnv(): Record<string, string | number | boolean> {
  return compactRecord({
   ...this.options.tags,
   project: this.options.project,
   pagePath: this.options.pagePath,
   pageUrl: this.options.pageUrl,
   pageOriginUrl: this.options.pageUrl,
   userAgent: this.options.userAgent,
   ua: this.options.userAgent,
   sdkVersion: this.options.sdkVersion,
   pageNavStart: this.options.pageNavStart,
   isOffline: this.options.isOffline,
   runEnv: this.options.runEnv,
   biz: this.options.biz,
   screen: this.options.screen,
   version: this.options.version,
   visitId: this.options.visitId,
   networkType: this.options.networkType,
   uuid: this.options.uuid,
   containerVersion: this.options.containerVersion
  });
 }
}

export interface FspPluginOptions {
 onReady?: (manager: FspManager) => void;
 cache?: PerfCache;
 random?: () => number;
 now?: () => number;
 beforeSend?: BeforeSendFsp;
 runtime?: FspRuntime;
 containerBridge?: BridgeLike;
 metadata?: FspMetadata;
}

export interface FspMetadata {
 pagePath?: string;
 pageUrl?: string;
 userAgent?: string;
 sdkVersion?: string;
 pageNavStart?: number;
 isOffline?: boolean;
 runEnv?: PerfRunEnv;
 biz?: string;
 screen?: string;
 version?: string;
 visitId?: string;
 networkType?: string;
 uuid?: string;
 containerVersion?: string;
}

export function createFspPlugin(options: FspPluginOptions = {}): Plugin {
 let manager: FspManager | undefined;
 let stopWatch: (() => void) | undefined;
 return {
  name: packageName,
  start(context: MonitorContext) {
   const perf = context.cfgManager.getConfig("perf");
   if (!perf.enable || !perf.fsp.enable) {
    return;
   }

   const bridgeConfig = context.cfgManager.getConfig("bridge");
   const metadata = resolveFspMetadata(options, context.cfgManager.getConfig("project"));
   manager = new FspManager({
    send: context.transport.send.bind(context.transport),
    endpoint: perf.fsp.endpoint,
    project: context.cfgManager.getConfig("project"),
    ...metadata,
    sample: perf.fsp.sample,
    timeout: perf.fsp.timeout,
    tags: perf.fsp.customTags,
    cache: options.cache,
    random: options.random,
    now: options.now,
    beforeSend: options.beforeSend,
    containerBridge: createFspContainerBridge(options, bridgeConfig.preferredMethod)
   });
   options.onReady?.(manager);
   stopWatch = watchFspRuntime(manager, {
    timeout: perf.fsp.timeout,
    useIgnore: Boolean(perf.fsp.useIgnore),
    fspClsEnable: perf.fsp.fspClsEnable !== false,
    defer: perf.fsp.defer !== false,
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

export function calculateFsp(input: FspInput): FspMetrics {
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

function normalizeReportInput(input?: number | FspReportInput, detector?: FspDetectorSnapshot, mutationCount = 0): FspReportInput {
 if (typeof input === "number") {
  return { timestamp: input, detector, mutationCount };
 }
 return input ?? {};
}

function createDetectorMetrics(
 detector?: FspDetectorSnapshot,
 mutationCount = 0,
 cls?: FspClsMetrics,
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

function compactRecord(input: Record<string, unknown>): Record<string, string | number | boolean> {
 const output: Record<string, string | number | boolean> = {};
 for (const [key, value] of Object.entries(input)) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
   output[key] = value;
  }
 }
 return output;
}

function createFspContainerBridge(options: FspPluginOptions, preferredMethod: string): ContainerBridgeReporter | undefined {
 const bridge = options.containerBridge ?? options.runtime?.containerBridge ?? getGlobalContainerBridge();
 if (!bridge) {
  return undefined;
 }
 return createContainerBridgeReporter({
  bridge,
  preferredMethod
 });
}

function resolveFspMetadata(options: FspPluginOptions, project: string): FspMetadata {
 const metadata = createPerfMetadata({
  project,
  runtime: options.runtime ?? getBrowserRuntimeMetadata(),
  ...options.metadata
 });
 return toFspMetadata(metadata, options.metadata);
}

function getBrowserRuntimeMetadata(): FspRuntime | undefined {
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
 for (const key of ["containerBridge", "nativeBridge", "NativeBridge", "bridge"]) {
  const bridge = scope[key];
  if (bridge && typeof bridge === "object") {
   return bridge as BridgeLike;
  }
 }
 return undefined;
}

function toFspMetadata(metadata: PerfMetadata, overrides?: FspMetadata): FspMetadata {
 return {
  pagePath: metadata.pagePath,
  pageUrl: metadata.pageUrl,
  userAgent: metadata.userAgent,
  sdkVersion: metadata.sdkVersion,
  pageNavStart: metadata.pageNavStart,
  isOffline: metadata.isOffline,
  runEnv: metadata.runEnv,
  biz: metadata.biz,
  screen: metadata.screen,
  version: metadata.version,
  visitId: metadata.visitId,
  networkType: metadata.networkType,
  uuid: metadata.uuid,
  containerVersion: metadata.containerVersion,
  ...overrides
 };
}
