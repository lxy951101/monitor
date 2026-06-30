import type { TransportRequest, TransportResponse } from "@monitor/transport";

export const packageName = "@monitor/plugin-perf-cache";

export interface PerfStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface PerfCacheRecord {
  method: "POST";
  url: string;
  body: string;
  timestamp: number;
}

export interface PerfCacheOptions {
  key?: string;
  maxLength?: number;
  storage?: PerfStorageLike;
  now?: () => number;
}

type SendFn = (request: TransportRequest) => Promise<TransportResponse | void>;

export class PerfCache {
  private readonly key: string;
  private readonly maxLength: number;
  private readonly storage?: PerfStorageLike;
  private readonly now: () => number;

  constructor(options: PerfCacheOptions = {}) {
    this.key = options.key ?? "__perf_cache";
    this.maxLength = options.maxLength ?? 50;
    this.storage = options.storage ?? getRuntimeStorage();
    this.now = options.now ?? Date.now;
  }

  add(request: TransportRequest): void {
    const body = typeof request.body === "string" ? request.body : "";
    const records = this.read();
    records.push({
      method: "POST",
      url: request.url,
      body,
      timestamp: this.now()
    });
    this.write(records.slice(-this.maxLength));
  }

  read(): PerfCacheRecord[] {
    if (!this.storage) {
      return [];
    }

    try {
      const value = this.storage.getItem(this.key);
      const records = value ? JSON.parse(value) : [];
      return Array.isArray(records) ? records.filter(isPerfCacheRecord) : [];
    } catch {
      return [];
    }
  }

  clear(): void {
    try {
      this.storage?.removeItem(this.key);
    } catch {
      // 清理失败不影响后续上报。
    }
  }

  async flush(send: SendFn): Promise<void> {
    const records = this.read();
    if (records.length === 0) {
      return;
    }

    this.clear();
    const failed = await sendCachedRecords(records, send);
    if (failed.length > 0) {
      this.write(failed.slice(-this.maxLength));
    }
  }

  private write(records: PerfCacheRecord[]): void {
    if (!this.storage) {
      return;
    }

    try {
      this.storage.setItem(this.key, JSON.stringify(records));
    } catch {
      // 缓存失败只丢弃缓存，不阻断主流程。
    }
  }
}

export async function sendWithPerfCache(
  request: TransportRequest,
  send: SendFn,
  cache?: PerfCache
): Promise<void> {
  try {
    await send(request);
  } catch (error) {
    cache?.add(request);
    throw error;
  }
}

async function sendCachedRecords(records: PerfCacheRecord[], send: SendFn): Promise<PerfCacheRecord[]> {
  const failed: PerfCacheRecord[] = [];
  for (const record of records) {
    try {
      await send({
        method: record.method,
        url: record.url,
        body: record.body,
        headers: {
          "content-type": "application/json;charset=UTF-8"
        }
      });
    } catch {
      failed.push(record);
    }
  }
  return failed;
}

function isPerfCacheRecord(value: unknown): value is PerfCacheRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as PerfCacheRecord;
  return record.method === "POST" && typeof record.url === "string" && typeof record.body === "string";
}

function getRuntimeStorage(): PerfStorageLike | undefined {
  if (typeof localStorage === "undefined") {
    return undefined;
  }

  return localStorage;
}
