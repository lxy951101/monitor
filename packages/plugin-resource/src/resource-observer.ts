import type { ResourceCallInput } from "./resource-manager";

export interface ResourceTimingEntryLike {
  name: string;
  initiatorType: string;
  startTime?: number;
  duration?: number;
  transferSize?: number;
  encodedBodySize?: number;
  decodedBodySize?: number;
}

export interface ResourceObserverEnv {
  PerformanceObserver?: new (callback: (list: { getEntries: () => ResourceTimingEntryLike[] }) => void) => {
    observe: (options: { type?: string; entryTypes?: string[]; buffered?: boolean }) => void;
    disconnect: () => void;
  };
  performance?: {
    getEntriesByType: (type: string) => ResourceTimingEntryLike[];
  };
}

export function createResourceCallFromEntry(entry: ResourceTimingEntryLike): ResourceCallInput | undefined {
  if (!["script", "link", "img", "css", "fetch", "xmlhttprequest"].includes(entry.initiatorType)) {
    return undefined;
  }

  return {
    resourceUrl: entry.name,
    type: normalizeType(entry.initiatorType),
    connectType: "resource",
    duration: Math.round(entry.duration ?? 0),
    responsebyte: entry.transferSize ?? entry.encodedBodySize ?? entry.decodedBodySize ?? 0,
    timestamp: Math.round(entry.startTime ?? Date.now())
  };
}

export function collectResourceEntries(entries: ResourceTimingEntryLike[]): ResourceCallInput[] {
  return entries.flatMap((entry) => {
    const call = createResourceCallFromEntry(entry);
    return call ? [call] : [];
  });
}

export function startResourceObserver(
  env: ResourceObserverEnv,
  onCall: (call: ResourceCallInput) => void
): () => void {
  if (env.PerformanceObserver) {
    const observer = new env.PerformanceObserver((list) => {
      for (const call of collectResourceEntries(list.getEntries())) {
        onCall(call);
      }
    });
    observer.observe({ type: "resource", buffered: true });
    return () => observer.disconnect();
  }

  for (const call of collectResourceEntries(env.performance?.getEntriesByType("resource") ?? [])) {
    onCall(call);
  }
  return () => undefined;
}

function normalizeType(type: string): string {
  return type === "xmlhttprequest" ? "ajax" : type;
}

