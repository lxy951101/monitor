/**
 * 内部实现。
 * 索引 0 预留，1-19 对应 W3C Navigation Timing。
 */
export const PERF_INDEX: Record<string, number> = {
 unloadEventStart: 1,
 unloadEventEnd: 2,
 redirectStart: 3,
 redirectEnd: 4,
 fetchStart: 5,
 domainLookupStart: 6,
 domainLookupEnd: 7,
 connectStart: 8,
 connectEnd: 9,
 requestStart: 10,
 responseStart: 11,
 responseEnd: 12,
 domLoading: 13,
 domInteractive: 14,
 domContentLoadedEventStart: 15,
 domContentLoadedEventEnd: 16,
 domComplete: 17,
 loadEventStart: 18,
 loadEventEnd: 19,
};

/** 派生 & Paint 点位 */
export const DERIVED_INDEX = {
 dns: 20,
 tcp: 21,
 download: 22,
 firstPaint: 23,
 firstContentfulPaint: 24,
 FST: 25,
 FCP: 26,
} as const;

export const TOTAL_POINTS = 27; // 0-26

export interface PageSpeedModel {
 navigationStart: number;
 unloadEventStart: number;
 unloadEventEnd: number;
 redirectStart: number;
 redirectEnd: number;
 fetchStart: number;
 domainLookupStart: number;
 domainLookupEnd: number;
 connectStart: number;
 connectEnd: number;
 requestStart: number;
 responseStart: number;
 responseEnd: number;
 domLoading: number;
 domInteractive: number;
 domContentLoadedEventStart: number;
 domContentLoadedEventEnd: number;
 domComplete: number;
 loadEventStart: number;
 loadEventEnd: number;
 /** DNS 耗时 = domainLookupEnd - domainLookupStart */
 dns?: number;
 /** TCP 耗时 = connectEnd - connectStart */
 tcp?: number;
 /** 下载耗时 = responseEnd - requestStart */
 download?: number;
 /** first-paint */
 firstPaint?: number;
 /** first-contentful-paint */
 firstContentfulPaint?: number;
 /** 首屏时间 */
 FST?: number;
 /** 首屏内容绘制 */
 FCP?: number;
}

export interface CreatePageSpeedModelInput {
 navigationStart: number;
 unloadEventStart?: number;
 unloadEventEnd?: number;
 redirectStart?: number;
 redirectEnd?: number;
 fetchStart?: number;
 domainLookupStart?: number;
 domainLookupEnd?: number;
 connectStart?: number;
 connectEnd?: number;
 requestStart?: number;
 responseStart?: number;
 responseEnd?: number;
 domLoading?: number;
 domInteractive?: number;
 domContentLoadedEventStart?: number;
 domContentLoadedEventEnd?: number;
 domComplete?: number;
 loadEventStart?: number;
 loadEventEnd?: number;
 dns?: number;
 tcp?: number;
 download?: number;
 firstPaint?: number;
 firstContentfulPaint?: number;
 FST?: number;
 FCP?: number;
}

export interface CustomSpeedModel {
 points: number[];
}

export interface CreateCustomSpeedModelInput {
 points: number[];
}

export function createPageSpeedModel(input: CreatePageSpeedModelInput): PageSpeedModel {
 return {
  navigationStart: input.navigationStart,
  unloadEventStart: input.unloadEventStart ?? 0,
  unloadEventEnd: input.unloadEventEnd ?? 0,
  redirectStart: input.redirectStart ?? 0,
  redirectEnd: input.redirectEnd ?? 0,
  fetchStart: input.fetchStart ?? 0,
  domainLookupStart: input.domainLookupStart ?? 0,
  domainLookupEnd: input.domainLookupEnd ?? 0,
  connectStart: input.connectStart ?? 0,
  connectEnd: input.connectEnd ?? 0,
  requestStart: input.requestStart ?? 0,
  responseStart: input.responseStart ?? 0,
  responseEnd: input.responseEnd ?? 0,
  domLoading: input.domLoading ?? 0,
  domInteractive: input.domInteractive ?? 0,
  domContentLoadedEventStart: input.domContentLoadedEventStart ?? 0,
  domContentLoadedEventEnd: input.domContentLoadedEventEnd ?? 0,
  domComplete: input.domComplete ?? 0,
  loadEventStart: input.loadEventStart ?? 0,
  loadEventEnd: input.loadEventEnd ?? 0,
  dns: input.dns,
  tcp: input.tcp,
  download: input.download,
  firstPaint: input.firstPaint,
  firstContentfulPaint: input.firstContentfulPaint,
  FST: input.FST,
  FCP: input.FCP,
 };
}

/**
 * 将 PageSpeedModel 编码为兼容的测速点字符串。
 * 点位 0 预留为空，点位 1-26 对应具体指标，未填充的位置默认填 0。
 */
export function encodePageSpeed(model: PageSpeedModel): string {
 const points = new Array<number>(TOTAL_POINTS).fill(0);

 for (const [key, idx] of Object.entries(PERF_INDEX)) {
  const value = (model as unknown as Record<string, number | undefined>)[key];
  points[idx] = normalize(value);
 }

 // 派生指标 (20-22): 优先使用预计算值，否则从 timing 推算
 points[DERIVED_INDEX.dns] = model.dns ?? normalize(
  (model.domainLookupEnd || 0) - (model.domainLookupStart || 0),
 );
 points[DERIVED_INDEX.tcp] = model.tcp ?? normalize(
  (model.connectEnd || 0) - (model.connectStart || 0),
 );
 points[DERIVED_INDEX.download] = model.download ?? normalize(
  (model.responseEnd || 0) - (model.requestStart || 0),
 );

 // Paint (23-24)
 if (model.firstPaint !== undefined || model.firstContentfulPaint !== undefined) {
  points[DERIVED_INDEX.firstPaint] = normalize(model.firstPaint);
  points[DERIVED_INDEX.firstContentfulPaint] = normalize(model.firstContentfulPaint);
 }

 // FST / FCP (25-26)
 if (model.FST !== undefined || model.FCP !== undefined) {
  points[DERIVED_INDEX.FST] = normalize(model.FST);
  points[DERIVED_INDEX.FCP] = normalize(model.FCP);
 }

 return points.join("|");
}

export function createCustomSpeedModel(input: CreateCustomSpeedModelInput): CustomSpeedModel {
 return {
  points: input.points,
 };
}

/**
 * 编码自定义测速点位。
 */
export function encodeCustomSpeed(model: CustomSpeedModel): string {
 return model.points.join("|");
}

function normalize(value: number | undefined): number {
 return Number.isFinite(value ?? NaN) && (value ?? 0) >= 0 ? Math.round(value!) : 0;
}
