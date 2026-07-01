export interface TraceIdOptions {
  now?: () => number;
  random?: () => number;
  prefix?: string;
}

export function traceId(options: TraceIdOptions = {}): string {
  const now = options.now ?? Date.now;
  const random = options.random ?? Math.random;
  const prefix = options.prefix ?? "monitor";
  const timestamp = Math.floor(now());
  const randomPart = Math.floor(random() * Number.MAX_SAFE_INTEGER).toString(36);

  return `${prefix}-${timestamp}-${randomPart}`;
}
