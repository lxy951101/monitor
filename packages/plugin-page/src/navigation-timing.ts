export interface NavigationTimingLike {
  navigationStart: number;
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
  domInteractive?: number;
  domComplete?: number;
  loadEventStart?: number;
  loadEventEnd?: number;
}

export interface PaintTimingLike {
  name: string;
  startTime: number;
}

export function encodePageSpeedFromTiming(timing: NavigationTimingLike): string {
  const base = timing.navigationStart;
  return [
    0,
    diff(timing.redirectStart, base),
    diff(timing.redirectEnd, base),
    diff(timing.domainLookupStart, base),
    diff(timing.domainLookupEnd, base),
    diff(timing.fetchStart, base),
    diff(timing.connectStart, base),
    diff(timing.connectEnd, base),
    diff(timing.requestStart, base),
    diff(timing.responseStart, base),
    diff(timing.domInteractive, base),
    diff(timing.loadEventStart, base),
    diff(timing.responseEnd, base),
    diff(timing.domComplete, base),
    diff(timing.loadEventEnd, base)
  ].join("|");
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
  return normalize((value ?? 0) - base);
}

function normalize(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
}

