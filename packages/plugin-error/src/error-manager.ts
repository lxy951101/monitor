import { CfgManager, getPageUrl, safeJsonStringify, traceId, type CoreConfigPatch } from "@monitor/core";
import { createErrorModel, encodeErrorBody, type ErrorModel } from "@monitor/protocol";
import type { TransportRequest, TransportResponse } from "@monitor/transport";
import {
  appendErrorCache,
  clearErrorCache,
  readErrorCache,
  writeErrorCache,
  type CachedErrorRequest,
  type ErrorCacheOptions,
  type StorageLike
} from "./cache";

type SendFn = (request: TransportRequest) => Promise<TransportResponse | void>;
type IgnoreItem = string | RegExp | ((content: string, error: unknown) => boolean);
type ModelFilter = (model: ErrorModel) => boolean;
type BeforeSend = (model: ErrorModel) => ErrorModel | false | null | undefined;

export interface BeaconNavigator {
  sendBeacon?: (url: string, data?: BodyInit | null) => boolean;
}

export interface ErrorManagerOptions extends CoreConfigPatch {
  pageUrl?: string;
  realUrl?: string;
  send: SendFn;
  cfgManager?: CfgManager;
  maxSize?: number;
  maxNum?: number;
  maxTime?: number;
  ignoreList?: IgnoreItem[];
  beforeSend?: BeforeSend;
  filter?: ModelFilter;
  useSendBeacon?: boolean;
  disableCache?: boolean;
  cacheKey?: string;
  storage?: StorageLike;
  navigator?: BeaconNavigator;
  dedupeTime?: number;
}

export interface ErrorAddOptions {
  category?: string;
  sec_category?: string;
  level?: string;
  resourceUrl?: string;
  rowNum?: number;
  colNum?: number;
  tags?: Record<string, string>;
  unionId?: string;
}

interface QueueItem {
  model: ErrorModel;
  key: string;
}

const DEFAULT_MAX_SIZE = 2048;
const DEFAULT_MAX_NUM = 20;
const DEFAULT_DEDUPE_TIME = 5000;

export class ErrorManager {
  private readonly cfgManager: CfgManager;
  private readonly send: SendFn;
  private readonly options: ErrorManagerOptions;
  private readonly queue: QueueItem[] = [];
  private readonly recent = new Map<string, number>();
  private flushTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(options: ErrorManagerOptions) {
    this.options = options;
    this.send = options.send;
    this.cfgManager = options.cfgManager ?? new CfgManager(options);
  }

  addError(errorLike: unknown, options: ErrorAddOptions = {}): void {
    const content = this.createContent(errorLike);
    if (!content || this.shouldIgnore(content, errorLike)) {
      return;
    }

    const model = this.createModel(truncateText(content, this.getMaxSize()), options);
    const prepared = this.applyFilters(model);
    if (!prepared) {
      return;
    }

    const key = this.createDedupeKey(prepared);
    if (this.isDuplicate(key)) {
      return;
    }

    this.enqueue({ model: prepared, key });
  }

  async flush(): Promise<void> {
    await this.sendErrors();
  }

  async sendErrors(): Promise<void> {
    this.clearFlushTimer();
    if (this.queue.length === 0) {
      return;
    }

    const batch = this.queue.splice(0, this.queue.length);
    const request = this.createCachedRequest(batch.map((item) => item.model));
    try {
      await this.send(this.toTransportRequest(request));
      this.forgetQueueKeys(batch);
    } catch (error) {
      if (!this.cacheRequests([request])) {
        this.queue.unshift(...batch);
      }
      throw error;
    }
  }

  async sendCachedErrors(): Promise<void> {
    const cacheOptions = this.getCacheOptions();
    const cached = readErrorCache(cacheOptions);
    if (cached.length === 0) {
      return;
    }

    for (let index = 0; index < cached.length; index += 1) {
      const request = cached[index];
      try {
        await this.send(this.toTransportRequest(request));
      } catch (error) {
        this.writeCachedRemainder(cached.slice(index));
        throw error;
      }
    }
    clearErrorCache(cacheOptions);
  }

  handlePageLeave(): void {
    this.clearFlushTimer();
    if (this.queue.length === 0) {
      return;
    }

    const batch = this.queue.splice(0, this.queue.length);
    const request = this.createCachedRequest(batch.map((item) => item.model));
    if (this.trySendBeacon(request)) {
      this.forgetQueueKeys(batch);
      return;
    }

    this.cacheRequests([request]);
  }

  private createContent(errorLike: unknown): string {
    if (errorLike instanceof Error) {
      return errorLike.stack || `${errorLike.name}: ${errorLike.message}`;
    }

    if (typeof errorLike === "string") {
      return errorLike;
    }

    return safeJsonStringify(errorLike);
  }

  private createModel(content: string, options: ErrorAddOptions): ErrorModel {
    const pageUrl = this.options.pageUrl ?? getPageUrl();
    return createErrorModel({
      project: this.cfgManager.getConfig("project"),
      pageUrl,
      realUrl: this.options.realUrl ?? pageUrl,
      resourceUrl: options.resourceUrl,
      category: options.category,
      sec_category: options.sec_category,
      level: options.level,
      unionId: options.unionId,
      timestamp: Date.now(),
      content,
      traceid: traceId(),
      rowNum: options.rowNum,
      colNum: options.colNum,
      tags: options.tags
    });
  }

  private shouldIgnore(content: string, errorLike: unknown): boolean {
    return this.getIgnoreList().some((item) => {
      try {
        if (typeof item === "string") {
          return content.includes(item);
        }
        if (item instanceof RegExp) {
          item.lastIndex = 0;
          return item.test(content);
        }
        return item(content, errorLike);
      } catch {
        return false;
      }
    });
  }

  private applyFilters(model: ErrorModel): ErrorModel | undefined {
    try {
      if (this.options.filter?.(model) === false) {
        return undefined;
      }

      const beforeSendResult = this.options.beforeSend?.(model) ?? model;
      return beforeSendResult === false || beforeSendResult === null ? undefined : beforeSendResult;
    } catch {
      return model;
    }
  }

  private enqueue(item: QueueItem): void {
    this.queue.push(item);
    this.recent.set(item.key, Date.now());
    if (this.queue.length >= this.getMaxNum()) {
      this.flushInBackground();
      return;
    }

    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    const maxTime = this.options.maxTime;
    if (!maxTime || this.flushTimer) {
      return;
    }

    this.flushTimer = setTimeout(() => {
      this.flushInBackground();
    }, maxTime);
  }

  private clearFlushTimer(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  private flushInBackground(): void {
    void this.sendErrors().catch(() => {
      // sendErrors 已恢复队列或写入缓存，后台路径吞掉异常以避免二次全局错误。
    });
  }

  private createCachedRequest(models: ErrorModel[]): CachedErrorRequest {
    return {
      url: this.cfgManager.getApiPath("log"),
      body: encodeErrorBody(models)
    };
  }

  private toTransportRequest(request: CachedErrorRequest): TransportRequest {
    return {
      method: "POST",
      url: request.url,
      body: request.body,
      headers: {
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8"
      }
    };
  }

  private trySendBeacon(request: CachedErrorRequest): boolean {
    if (!this.options.useSendBeacon) {
      return false;
    }

    return this.getNavigator()?.sendBeacon?.(request.url, request.body) === true;
  }

  private cacheRequests(requests: CachedErrorRequest[]): boolean {
    if (this.options.disableCache) {
      return false;
    }

    return appendErrorCache(requests, this.getCacheOptions());
  }

  private writeCachedRemainder(requests: CachedErrorRequest[]): void {
    writeErrorCache(requests, this.getCacheOptions());
  }

  private getNavigator(): BeaconNavigator | undefined {
    return this.options.navigator ?? getRuntimeNavigator();
  }

  private getCacheOptions(): ErrorCacheOptions {
    return {
      key: this.options.cacheKey,
      storage: this.options.storage
    };
  }

  private getIgnoreList(): IgnoreItem[] {
    return [
      ...(this.cfgManager.getConfig("error").ignoreList as IgnoreItem[]),
      ...(this.options.ignoreList ?? [])
    ];
  }

  private getMaxSize(): number {
    return this.options.maxSize ?? DEFAULT_MAX_SIZE;
  }

  private getMaxNum(): number {
    return this.options.maxNum ?? this.cfgManager.getConfig("error").maxQueueLength ?? DEFAULT_MAX_NUM;
  }

  private createDedupeKey(model: ErrorModel): string {
    return `${model.category}|${model.sec_category}|${model.content}`;
  }

  private isDuplicate(key: string): boolean {
    this.pruneRecent();
    return this.queue.some((item) => item.key === key) || this.recent.has(key);
  }

  private pruneRecent(): void {
    const expiredAt = Date.now() - (this.options.dedupeTime ?? DEFAULT_DEDUPE_TIME);
    for (const [key, time] of this.recent.entries()) {
      if (time < expiredAt) {
        this.recent.delete(key);
      }
    }
  }

  private forgetQueueKeys(batch: QueueItem[]): void {
    for (const item of batch) {
      this.recent.delete(item.key);
    }
  }
}

function truncateText(value: string, maxSize: number): string {
  if (value.length <= maxSize) {
    return value;
  }

  return value.slice(0, maxSize);
}

function getRuntimeNavigator(): BeaconNavigator | undefined {
  if (typeof globalThis.navigator === "undefined") {
    return undefined;
  }

  return globalThis.navigator;
}
