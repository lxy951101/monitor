export interface TraceIdOptions {
  now?: () => number;
  random?: () => number;
}

export function traceId(options: TraceIdOptions = {}): string {
  const now = options.now ?? Date.now;
  const random = options.random ?? Math.random;
  const suffix = Math.floor(random() * Number.MAX_SAFE_INTEGER).toString(36);

  return `monitor-${now()}-${suffix}`;
}
