export interface StorageLike {
 getItem(key: string): string | null;
 setItem(key: string, value: string): void;
 removeItem(key: string): void;
}

export interface CachedErrorRequest {
 url: string;
 body: string;
}

export interface ErrorCacheOptions {
 key?: string;
 storage?: StorageLike;
 onError?: (error: unknown) => void;
}

export const DEFAULT_ERROR_CACHE_KEY = "__monitor_error_cache__";

export function readErrorCache(options: ErrorCacheOptions = {}): CachedErrorRequest[] {
 const storage = getStorage(options);
 if (!storage) {
  return [];
 }

 try {
  const value = storage.getItem(getCacheKey(options));
  const parsed: unknown = value ? JSON.parse(value) : [];
  return Array.isArray(parsed) ? parsed.filter(isCachedErrorRequest) : [];
 } catch (error) {
  options.onError?.(error);
  return [];
 }
}

export function writeErrorCache(
 requests: CachedErrorRequest[],
 options: ErrorCacheOptions = {}
): boolean {
 const storage = getStorage(options);
 if (!storage) {
  return false;
 }

 try {
  storage.setItem(getCacheKey(options), JSON.stringify(requests));
  return true;
 } catch (error) {
  options.onError?.(error);
  return false;
 }
}

export function appendErrorCache(
 requests: CachedErrorRequest[],
 options: ErrorCacheOptions = {}
): boolean {
 if (requests.length === 0) {
  return true;
 }

 return writeErrorCache([...readErrorCache(options), ...requests], options);
}

export function clearErrorCache(options: ErrorCacheOptions = {}): void {
 const storage = getStorage(options);
 if (!storage) {
  return;
 }

 try {
  storage.removeItem(getCacheKey(options));
 } catch (error) {
  options.onError?.(error);
 }
}

function getCacheKey(options: ErrorCacheOptions): string {
 return options.key ?? DEFAULT_ERROR_CACHE_KEY;
}

function isCachedErrorRequest(value: unknown): value is CachedErrorRequest {
 if (!value || typeof value !== "object") {
  return false;
 }

 const request = value as Partial<CachedErrorRequest>;
 return typeof request.url === "string" && typeof request.body === "string";
}

function getStorage(options: ErrorCacheOptions): StorageLike | undefined {
 try {
  return options.storage ?? getRuntimeStorage();
 } catch (error) {
  options.onError?.(error);
  return undefined;
 }
}

function getRuntimeStorage(): StorageLike | undefined {
 if (typeof globalThis.localStorage === "undefined") {
  return undefined;
 }

 return globalThis.localStorage;
}
