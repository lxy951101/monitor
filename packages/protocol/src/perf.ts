export type PerfValue = string | number | boolean | Record<string, string | number | boolean>;

export type PerfEnv = Record<string, PerfValue>;

export type PerfLog = Record<string, PerfValue>;

export interface PerfLogPayload {
 category: string;
 env: PerfEnv;
 logs: PerfLog[];
}

export interface CreatePerfLogPayloadInput {
 category: string;
 env?: PerfEnv;
 logs: PerfLog[];
}

export interface CreatePerfCustomPayloadInput {
 category: string;
 env?: PerfEnv;
 metrics: PerfLog;
}

export type FspBridgeEventType = "start" | "success" | "interact" | "timeout" | "notsupport" | "error" | "hidden";

export interface FspBridgeMetrics {
 reachBottom: boolean;
 renderRate: number;
 mutationCount: number;
 costMs?: number;
 calibrateEndType?: string;
 clsCycleLength?: number;
 clsCycleNum?: number;
 clsCycleThreshold?: number;
 pageLoadedTime?: number;
 pageStable?: boolean;
 loadedStableGap?: number;
}

export interface CreateFspBridgeEventInput {
 type: FspBridgeEventType;
 createMs: number;
 appId: string;
 pagePath?: string;
 pageUrl?: string;
 userAgent?: string;
 sdkVersion?: string;
 pageNavStart?: number;
 isOffline?: boolean;
 sampleRate?: number;
 tags?: PerfEnv;
 metrics: FspBridgeMetrics;
}

export interface FspBridgeEvent extends PerfLog {
 eType: FspBridgeEventType;
 createMs: number;
 appId: string;
 reachBottom: "reached" | "notReached";
 mutationCount: number;
 renderRate: number;
 $sr: number;
}

export function createPerfLogPayload(input: CreatePerfLogPayloadInput): PerfLogPayload {
 return {
  category: input.category,
  env: input.env ?? {},
  logs: input.logs
 };
}

export function createPerfCustomPayload(input: CreatePerfCustomPayloadInput): PerfLogPayload {
 return {
  category: input.category,
  env: input.env ?? {},
  logs: [input.metrics]
 };
}

export function createFspBridgeEvent(input: CreateFspBridgeEventInput): FspBridgeEvent {
 const event: FspBridgeEvent = {
  ...(input.tags ?? {}),
  eType: input.type,
  createMs: input.createMs,
  appId: input.appId,
  reachBottom: input.metrics.reachBottom ? "reached" : "notReached",
  costMs: input.metrics.costMs ?? 0,
  mutationCount: input.metrics.mutationCount,
  renderRate: input.metrics.renderRate,
  $sr: Math.min(input.sampleRate ?? 1, 1)
 };

 if (input.pagePath) {
  event.pagePath = input.pagePath;
 }
 if (input.pageUrl) {
  event.pageUrl = input.pageUrl;
 }
 if (input.userAgent) {
  event.userAgent = input.userAgent;
 }
 if (input.sdkVersion) {
  event.sdkVersion = input.sdkVersion;
 }
 if (typeof input.pageNavStart === "number") {
  event.pageNavStart = input.pageNavStart;
 }
 if (typeof input.isOffline === "boolean") {
  event.isOffline = input.isOffline;
 }
 if (typeof input.metrics.pageLoadedTime === "number") {
  event.detect_cls = true;
  if (input.metrics.calibrateEndType) {
   event.calibrateEndType = input.metrics.calibrateEndType;
  }
  if (typeof input.metrics.clsCycleLength === "number") {
   event.ffp_cls_cycle_length = input.metrics.clsCycleLength;
  }
  if (typeof input.metrics.clsCycleNum === "number") {
   event.ffp_cls_cycle_num = input.metrics.clsCycleNum;
  }
  if (typeof input.metrics.clsCycleThreshold === "number") {
   event.ffp_cls_cycle_threshold = input.metrics.clsCycleThreshold;
  }
  event.ffp_page_loaded = input.metrics.reachBottom;
  event.ffp_loaded_time = input.metrics.pageLoadedTime;
  event.ffp_page_stable = Boolean(input.metrics.pageStable);
  event.ffp_loaded_stable_gap = input.metrics.loadedStableGap ?? 0;
 }

 return event;
}
