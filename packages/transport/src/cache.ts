export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LocalStorageCacheOptions {
  key: string;
  storage?: StorageLike;
  onError?: (error: unknown) => void;
}

export class LocalStorageCache<T = unknown> {
  private readonly key: string;
  private readonly storage?: StorageLike;
  private readonly onError?: (error: unknown) => void;

  constructor(options: LocalStorageCacheOptions) {
    this.key = options.key;
    this.storage = options.storage ?? getGlobalLocalStorage();
    this.onError = options.onError;
  }

  get(): T[] {
    if (!this.storage) {
      return [];
    }

    try {
      const value = this.storage.getItem(this.key);
      if (!value) {
        return [];
      }

      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch (error) {
      this.onError?.(error);
      return [];
    }
  }

  save(items: T[]): void {
    if (!this.storage) {
      return;
    }

    try {
      this.storage.setItem(this.key, JSON.stringify(items));
    } catch (error) {
      this.onError?.(error);
    }
  }

  clear(): void {
    if (!this.storage) {
      return;
    }

    try {
      this.storage.removeItem(this.key);
    } catch (error) {
      this.onError?.(error);
    }
  }
}

function getGlobalLocalStorage(): StorageLike | undefined {
  return typeof globalThis.localStorage === "undefined" ? undefined : globalThis.localStorage;
}
