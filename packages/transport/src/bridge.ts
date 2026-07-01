import { TransportError, type Transport, type TransportRequest } from "./types";

export interface BridgeCallbacks {
  success: (response?: unknown) => void;
  fail: (error?: unknown) => void;
}

export type BridgeMethod = (
  params: BridgeRequestParams,
  callbacks: BridgeCallbacks
) => void;

export type ContainerBridgeMethod = (
  event: Record<string, unknown>,
  callbacks: BridgeCallbacks
) => void;

export type BridgeLike = Record<string, unknown>;

export interface BridgeRequestParams {
  method: TransportRequest["method"];
  url: string;
  headers?: Record<string, string>;
  body?: BodyInit | null;
}

export interface BridgeTransportOptions {
  bridge?: BridgeLike;
  method: string;
}

export interface ContainerBridgeReporterOptions {
  bridge?: BridgeLike;
  preferredMethod?: string;
  fallbackMethods?: string[];
  cacheStorage?: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  cacheKey?: string;
  cacheMaxLength?: number;
}

export interface ContainerBridgeReporter {
  reportFsp2(event: Record<string, unknown>): Promise<{ ok: true; status: 0; body?: unknown; cached?: boolean }>;
}

interface CachedBridgeEvent {
  methodName: string;
  event: Record<string, unknown>;
}

const DEFAULT_CONTAINER_BRIDGE_CACHE_KEY = "monitor_container_bridge_cache";
const DEFAULT_CONTAINER_BRIDGE_CACHE_MAX_LENGTH = 50;

export function createBridgeTransport(options: BridgeTransportOptions): Transport {
  return {
    send(request) {
      const method = options.bridge?.[options.method];
      if (typeof method !== "function") {
        return Promise.reject(
          new TransportError(`Bridge method ${options.method} is not available`)
        );
      }

      return sendWithBridge(method as BridgeMethod, request);
    }
  };
}

export function createContainerBridgeReporter(options: ContainerBridgeReporterOptions): ContainerBridgeReporter {
  return {
    async reportFsp2(event) {
      const methodName = options.preferredMethod ?? "ffp.record";
      const method = getBridgeMethods(options).find((candidate) => getBridgeMethod(options.bridge, candidate));
      if (!method) {
        saveContainerBridgeCache(options, { methodName, event });
        return { ok: true, status: 0, cached: true };
      }
      await flushContainerBridgeCache(options);
      return sendEventWithBridge(getBridgeMethod(options.bridge, method) as ContainerBridgeMethod, event);
    }
  };
}

function sendWithBridge(method: BridgeMethod, request: TransportRequest) {
  return new Promise<{ ok: true; status: 0; body?: unknown }>((resolve, reject) => {
    method(createParams(request), {
      success: (response) => resolve({ ok: true, status: 0, body: response }),
      fail: (error) => reject(toBridgeError(error))
    });
  });
}

function sendEventWithBridge(method: ContainerBridgeMethod, event: Record<string, unknown>) {
  return new Promise<{ ok: true; status: 0; body?: unknown }>((resolve, reject) => {
    method(event, {
      success: (response) => resolve({ ok: true, status: 0, body: response }),
      fail: (error) => reject(toBridgeError(error))
    });
  });
}

function getBridgeMethod(bridge: BridgeLike | undefined, methodName: string): ContainerBridgeMethod | undefined {
  const method = bridge?.[methodName];
  return typeof method === "function" ? method as ContainerBridgeMethod : undefined;
}

function getBridgeMethods(options: ContainerBridgeReporterOptions): string[] {
  return [options.preferredMethod ?? "ffp.record", ...(options.fallbackMethods ?? [])];
}

async function flushContainerBridgeCache(options: ContainerBridgeReporterOptions): Promise<void> {
  const cached = readContainerBridgeCache(options);
  if (cached.length === 0) {
    return;
  }

  const failed: CachedBridgeEvent[] = [];
  for (const item of cached) {
    const method = getBridgeMethod(options.bridge, item.methodName);
    if (!method) {
      failed.push(item);
      continue;
    }
    try {
      await sendEventWithBridge(method, item.event);
    } catch {
      failed.push(item);
    }
  }
  writeContainerBridgeCache(options, failed);
}

function saveContainerBridgeCache(options: ContainerBridgeReporterOptions, item: CachedBridgeEvent): void {
  const maxLength = options.cacheMaxLength ?? DEFAULT_CONTAINER_BRIDGE_CACHE_MAX_LENGTH;
  const cached = readContainerBridgeCache(options);
  cached.push(item);
  writeContainerBridgeCache(options, cached.slice(-maxLength));
}

function readContainerBridgeCache(options: ContainerBridgeReporterOptions): CachedBridgeEvent[] {
  const storage = getBridgeCacheStorage(options);
  if (!storage) {
    return [];
  }
  try {
    const value = storage.getItem(getBridgeCacheKey(options));
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter(isCachedBridgeEvent) : [];
  } catch {
    return [];
  }
}

function writeContainerBridgeCache(options: ContainerBridgeReporterOptions, items: CachedBridgeEvent[]): void {
  const storage = getBridgeCacheStorage(options);
  if (!storage) {
    return;
  }
  try {
    if (items.length === 0) {
      storage.removeItem(getBridgeCacheKey(options));
      return;
    }
    storage.setItem(getBridgeCacheKey(options), JSON.stringify(items));
  } catch {
    // cache is best effort
  }
}

function getBridgeCacheStorage(options: ContainerBridgeReporterOptions): Pick<Storage, "getItem" | "setItem" | "removeItem"> | undefined {
  if (options.cacheStorage) {
    return options.cacheStorage;
  }
  if (typeof localStorage === "undefined") {
    return undefined;
  }
  return localStorage;
}

function getBridgeCacheKey(options: ContainerBridgeReporterOptions): string {
  return options.cacheKey ?? DEFAULT_CONTAINER_BRIDGE_CACHE_KEY;
}

function isCachedBridgeEvent(value: unknown): value is CachedBridgeEvent {
  if (!value || typeof value !== "object") {
    return false;
  }
  const item = value as CachedBridgeEvent;
  return typeof item.methodName === "string" && Boolean(item.event) && typeof item.event === "object";
}

function createParams(request: TransportRequest): BridgeRequestParams {
  return {
    method: request.method,
    url: request.url,
    headers: request.headers,
    body: request.body
  };
}

function toBridgeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new TransportError(
    typeof error === "string" ? error : "Bridge request failed"
  );
}
