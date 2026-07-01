import { HORN_URL } from "@monitor/config";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface HornManagerOptions {
  key: string;
  project?: string;
  hornUrl?: string;
  storage?: StorageLike;
  fetcher?: (url: string) => Promise<unknown>;
  ttl?: number;
  now?: () => number;
}

interface HornCache {
  expiresAt: number;
  data: unknown;
}

export class HornManager {
  private readonly options: HornManagerOptions;

  constructor(options: HornManagerOptions) {
    this.options = options;
  }

  async getConfig<T = unknown>(): Promise<T> {
    const cached = this.readCache<T>();
    if (cached !== undefined) {
      return cached;
    }

    const data = await this.fetchRemote<T>();
    this.writeCache(data);
    return data;
  }

  clearCache(): void {
    this.getStorage()?.removeItem(this.getCacheKey());
  }

  buildUrl(): string {
    const url = new URL(this.options.hornUrl ?? HORN_URL);
    url.searchParams.set("key", this.options.key);
    if (this.options.project) {
      url.searchParams.set("project", this.options.project);
    }
    return url.toString();
  }

  private readCache<T>(): T | undefined {
    const storage = this.getStorage();
    if (!storage) {
      return undefined;
    }

    try {
      const value = storage.getItem(this.getCacheKey());
      const cache = value ? (JSON.parse(value) as HornCache) : undefined;
      if (!cache || cache.expiresAt <= this.getNow()) {
        return undefined;
      }
      return cache.data as T;
    } catch {
      return undefined;
    }
  }

  private writeCache(data: unknown): void {
    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    const cache: HornCache = {
      data,
      expiresAt: this.getNow() + (this.options.ttl ?? 5 * 60 * 1000)
    };
    try {
      storage.setItem(this.getCacheKey(), JSON.stringify(cache));
    } catch {
      // 缓存只是优化，写入失败不应阻断远端配置生效。
    }
  }

  private async fetchRemote<T>(): Promise<T> {
    const fetcher = this.options.fetcher ?? getRuntimeFetcher();
    if (!fetcher) {
      throw new Error("Horn fetcher is not available");
    }

    return (await fetcher(this.buildUrl())) as T;
  }

  private getCacheKey(): string {
    return `_sdkHorn_${this.options.key}`;
  }

  private getNow(): number {
    return this.options.now?.() ?? Date.now();
  }

  private getStorage(): StorageLike | undefined {
    return this.options.storage ?? getRuntimeStorage();
  }
}

function getRuntimeFetcher(): ((url: string) => Promise<unknown>) | undefined {
  if (typeof fetch === "undefined") {
    return undefined;
  }

  return async (url: string) => {
    const response = await fetch(url);
    return response.json();
  };
}

function getRuntimeStorage(): StorageLike | undefined {
  if (typeof localStorage === "undefined") {
    return undefined;
  }

  return localStorage;
}
