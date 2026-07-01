export interface NavigationTimingLike {
 navigationStart: number;
 unloadEventStart?: number;
 unloadEventEnd?: number;
 redirectStart?: number;
 redirectEnd?: number;
 fetchStart?: number;
 domainLookupStart?: number;
 domainLookupEnd?: number;
 connectStart?: number;
 secureConnectionStart?: number;
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
}

export interface PaintTimingLike {
 name: string;
 startTime: number;
}

/**
 * W3C Navigation Timing 点位映射，一致的索引：
 * 1: unloadEventStart
 * 2: unloadEventEnd
 * 3: redirectStart
 * 4: redirectEnd
 * 5: fetchStart
 * 6: domainLookupStart
 * 7: domainLookupEnd
 * 8: connectStart
 * 9: connectEnd
 * 10: requestStart
 * 11: responseStart
 * 12: responseEnd
 * 13: domLoading
 * 14: domInteractive
 * 15: domContentLoadedEventStart
 * 16: domContentLoadedEventEnd
 * 17: domComplete
 * 18: loadEventStart
 * 19: loadEventEnd
 * 20: dns (domainLookupEnd - domainLookupStart)
 * 21: tcp (connectEnd - connectStart)
 * 22: download (responseEnd - requestStart)
 * 23: firstPaint
 * 24: firstContentfulPaint
 * 25: FST (首屏时间，由外部填入)
 * 26: FCP (首屏内容绘制，由外部填入)
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

const TOTAL_POINTS = 27; // 点位 0-26，共 27 个

/**
 * 将 Navigation Timing 编码为兼容的测速点字符串。
 * 点位 0 固定为 0，点位 1-19 对应 W3C 计时相对于 navigationStart 的偏移。
 */
export function encodePageSpeedFromTiming(timing: NavigationTimingLike): string {
 const base = timing.navigationStart;
 const points = new Array<number>(20); // 0-19
 points[0] = 0;

 for (const [key, idx] of Object.entries(PERF_INDEX)) {
  const value = (timing as unknown as Record<string, number | undefined>)[key];
  points[idx] = diff(value, base);
 }

 return points.join("|");
}

/**
 * 在 timing 基础上附加计算指标 (DNS / TCP / Download) 和 Paint Timing (FP / FCP)。
 * 返回完整的 27 点位数组（0-26），可交由 PageManager 合并 FST/FCP 后上报。
 */
export function buildSpeedPoints(
 timing: NavigationTimingLike,
 paintEntries?: PaintTimingLike[],
): number[] {
 const points = new Array<number>(TOTAL_POINTS).fill(0);

 // W3C 计时偏移 (1-19)
 const base = timing.navigationStart;
 for (const [key, idx] of Object.entries(PERF_INDEX)) {
  const value = (timing as unknown as Record<string, number | undefined>)[key];
  points[idx] = normalizeDiff(value, base);
 }

 // 计算指标 (20-22)
 const dnsStart = timing.domainLookupStart ?? 0;
 const dnsEnd = timing.domainLookupEnd ?? 0;
 points[20] = normalize(dnsEnd - dnsStart); // dns

 const tcpStart = timing.connectStart ?? 0;
 const tcpEnd = timing.connectEnd ?? 0;
 points[21] = normalize(tcpEnd - tcpStart); // tcp

 const reqStart = timing.requestStart ?? 0;
 const resEnd = timing.responseEnd ?? 0;
 points[22] = normalize(resEnd - reqStart); // download

 // Paint Timing (23-24)
 if (paintEntries?.length) {
  const firstPaint = findPaint(paintEntries, "first-paint");
  const firstContentfulPaint = findPaint(paintEntries, "first-contentful-paint");
  if (firstPaint > 0 && firstContentfulPaint > 0) {
   points[23] = firstPaint;
   points[24] = firstContentfulPaint;
  }
 }

 return points;
}

/**
 * 获取 Paint Timing 条目（FP / FCP）。
 * 在浏览器环境下从 performance API 读取，否则返回 undefined。
 */
export function getPaintEntries(): PaintTimingLike[] | undefined {
 if (typeof performance === "undefined") {
  return undefined;
 }
 const perf = performance as Performance & {
  getEntriesByType?: (type: string) => PerformanceEntry[];
 };
 if (typeof perf.getEntriesByType !== "function") {
  return undefined;
 }
 const entries = perf.getEntriesByType("paint");
 return entries as unknown as PaintTimingLike[] | undefined;
}

export function encodePaintTiming(entries: PaintTimingLike[]): string {
 const firstPaint = findPaint(entries, "first-paint");
 const firstContentfulPaint = findPaint(entries, "first-contentful-paint");
 return [normalize(firstPaint), normalize(firstContentfulPaint)].join("|");
}

function findPaint(entries: PaintTimingLike[], name: string): number {
 return entries.find((entry) => entry.name === name)?.startTime ?? 0;
}

function diff(value: number | undefined, base: number): number {
 const raw = (value ?? 0) - base;
 return Number.isFinite(raw) && raw >= 0 ? Math.round(raw) : 0;
}

function normalizeDiff(value: number | undefined, base: number): number {
 return normalize((value ?? 0) - base);
}

function normalize(value: number): number {
 return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
}
