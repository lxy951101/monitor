import {
  CfgManager,
  getPageUrl,
  safeJsonStringify,
  traceId,
  type CoreConfigPatch,
} from "@monitor/core";
import {
  createErrorModel,
  encodeErrorBody,
  parseErrorStack,
  type ErrorModel,
} from "@monitor/protocol";
import type { TransportRequest, TransportResponse } from "@monitor/transport";
import {
  appendErrorCache,
  clearErrorCache,
  readErrorCache,
  writeErrorCache,
  type CachedErrorRequest,
  type ErrorCacheOptions,
  type StorageLike,
} from "./cache";

type SendFn = (request: TransportRequest) => Promise<TransportResponse | void>;
type IgnoreItem = string | RegExp | ((content: string, error: unknown) => boolean);
type ModelFilter = (model: ErrorModel) => boolean;
type BeforeSend = (model: ErrorModel) => ErrorModel | false | null | undefined;
type OnErrorPush = (model: ErrorModel) => ErrorModel | undefined;

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
  delay?: number;
  ignoreList?: IgnoreItem[];
  beforeSend?: BeforeSend;
  filter?: ModelFilter;
  onErrorPush?: OnErrorPush;
  noScriptError?: boolean;
  formatUnhandledRejection?: boolean;
  useSendBeacon?: boolean;
  disableCache?: boolean;
  cacheKey?: string;
  storage?: StorageLike;
  navigator?: BeaconNavigator;
  dedupeTime?: number;
  webVersion?: string;
  pageId?: string;
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

interface InFlightRecord {
  xhr: Promise<TransportResponse | void>;
  cache: QueueItem[];
}

const DEFAULT_MAX_SIZE = 2048;
const DEFAULT_MAX_NUM = 20;
const DEFAULT_MAX_TIME = 60000;
const DEFAULT_DELAY = 200;
const DEFAULT_DEDUPE_TIME = 5000;

export class ErrorManager {
  private readonly cfgManager: CfgManager;
  private readonly send: SendFn;
  private readonly options: ErrorManagerOptions;
  private readonly queue: QueueItem[] = [];
  private readonly recent = new Map<string, number>();
  private flushTimer: ReturnType<typeof setTimeout> | undefined;
  private comboTimeout: ReturnType<typeof setTimeout> | undefined;

  // 限流相关
  private errorCount = 0;
  private timeLimit = Date.now();
  private isTimeLimited = false;

  // 在途请求追踪
  private cacheSending = new Map<number, InFlightRecord>();

  // 页面离开检测是否已注册
  private leavePatched = false;

  constructor(options: ErrorManagerOptions) {
    this.options = options;
    this.send = options.send;
    this.cfgManager = options.cfgManager ?? new CfgManager(options);
  }

  // ========== 公开方法 ==========

  /**
   * 通用错误上报入口，内部实现。
   */
  addError(errorLike: unknown, options: ErrorAddOptions = {}): void {
    const content = this.createContent(errorLike);
    if (!content || this.shouldIgnore(content, errorLike)) {
      return;
    }

    const model = this.createModel(content, options);
    this.pushModel(model);
  }

  /**
   * 解析 window.onerror 采集到的 JS 错误，内部实现。
   */
  parseWindowError(
    msg: string | Event,
    url?: string,
    line?: number,
    col?: number,
    error?: unknown,
  ): void {
    try {
      if (error && (error as Error).stack) {
        const err = error as Error;
        const parsed = this._processError(err);
        if (parsed.sec_category !== "Invalid_Error") {
          if (line !== undefined) parsed.rowNum = parsed.rowNum ?? line;
          if (col !== undefined) parsed.colNum = parsed.colNum ?? col;
          if (url !== undefined) parsed.resourceUrl = parsed.resourceUrl || url;
        }
        const model = createErrorModel({
          project: this.getProject(),
          pageUrl: this.getPageUrl(),
          realUrl: this.getRealUrl(),
          category: parsed.category,
          sec_category: parsed.sec_category,
          level: "error",
          unionId: this.getUnionId(),
          timestamp: Date.now(),
          content: parsed.content ?? "",
          traceid: traceId(),
          rowNum: parsed.rowNum,
          colNum: parsed.colNum,
          resourceUrl: parsed.resourceUrl,
        });
        this.pushModel(model);
      } else if (typeof msg === "string") {
        const model = createErrorModel({
          project: this.getProject(),
          pageUrl: this.getPageUrl(),
          realUrl: this.getRealUrl(),
          category: "jsError",
          sec_category: msg,
          level: "error",
          unionId: this.getUnionId(),
          timestamp: Date.now(),
          content: msg,
          traceid: traceId(),
          rowNum: line,
          colNum: col,
          resourceUrl: url,
        });
        this.pushModel(model);
      }
    } catch (e) {
      this.reportSystemError(e);
    }
  }

  /**
   * 处理 unhandledrejection 错误，内部实现。
   */
  parsePromiseUnhandled(event: PromiseRejectionEvent): void {
    if (!(event && event.type === "unhandledrejection")) return;
    try {
      const reason = event.reason;
      if (!reason) return;

      let name = "unhandledrejection";
      let stack = "";
      if (reason instanceof Error) {
        const errName = reason.message || reason.name || "";
        if (errName && this.getFormatUnhandledRejection()) {
          name = `[unhandledrejection] ${errName}`;
        }
        stack = reason.stack || reason.toString() || "";
      } else {
        stack = typeof reason === "string" ? reason : safeJsonStringify(reason);
      }

      const model = createErrorModel({
        project: this.getProject(),
        pageUrl: this.getPageUrl(),
        realUrl: this.getRealUrl(),
        category: "jsError",
        sec_category: name,
        level: "error",
        unionId: this.getUnionId(),
        timestamp: Date.now(),
        content: stack,
        traceid: traceId(),
      });
      this.pushModel(model);
    } catch (e) {
      this.reportSystemError(e);
    }
  }

  /**
   * 解析 console.error 参数，内部实现。
   */
  parseConsoleError(...args: unknown[]): void {
    try {
      if (!(args && args.length)) return;
      const contents: string[] = [];
      for (const arg of args) {
        if (!arg) continue;
        let msg = "";
        if (typeof arg === "string") {
          msg = arg;
        } else if (arg instanceof Error) {
          msg = arg.stack || arg.message || "";
        } else if (typeof ErrorEvent !== "undefined" && arg instanceof ErrorEvent) {
          msg = (arg.error && (arg.error.stack || arg.error.message)) || arg.message || "";
        } else {
          msg = safeJsonStringify(arg);
        }
        contents.push(msg);
      }
      if (contents.length) {
        const model = createErrorModel({
          project: this.getProject(),
          pageUrl: this.getPageUrl(),
          realUrl: this.getRealUrl(),
          category: "jsError",
          sec_category: "consoleError",
          level: "error",
          unionId: this.getUnionId(),
          timestamp: Date.now(),
          content: contents.join(" "),
          traceid: traceId(),
        });
        this.pushModel(model);
      }
    } catch (e) {
      this.reportSystemError(e);
    }
  }

  /**
   * 快捷上报方法，内部实现。
   */
  report(errorLike: unknown, options: ErrorAddOptions = {}): void {
    this.addError(errorLike, options);
    void this.sendErrors(true);
  }

  async flush(): Promise<void> {
    await this.sendErrors(true);
  }

  async sendErrors(isReportNow = true): Promise<void> {
    this.clearFlushTimer();
    if (this.queue.length === 0) {
      return;
    }

    // 限流检查
    if (!this.checkRateLimit()) {
      // 超出限制，丢弃队列但不写缓存
      this.queue.length = 0;
      return;
    }

    const batch = this.queue.splice(0, this.queue.length);
    const ts = Date.now();
    const request = this.createCachedRequest(
      batch.map((item) => this.addCacheExtension(item.model)),
    );
    const xhr = this.send(this.toTransportRequest(request));

    // 追踪在途请求
    this.cacheSending.set(ts, { xhr, cache: batch });

    try {
      const response = await xhr;
      this.cacheSending.delete(ts);
      this.forgetQueueKeys(batch);
      // 处理远程配置下发
      this.handleRemoteConfig(response);
    } catch (error) {
      const record = this.cacheSending.get(ts);
      this.cacheSending.delete(ts);
      if (!this.cacheRequests([request])) {
        // 缓存写失败，恢复队列
        const models = record?.cache.map((item) => item.model) ?? batch.map((item) => item.model);
        const restored = this.rebuildQueueItems(models);
        this.queue.unshift(...restored);
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

  /**
   * 延迟读取并上报 localStorage 中历史上报失败后存储的异常 。
   */
  checkCache(): void {
    setTimeout(() => {
      void this.sendCachedErrors().catch(() => undefined);
    }, 4000);
  }

  handlePageLeave(): void {
    this.clearFlushTimer();
    if (this.comboTimeout) {
      clearTimeout(this.comboTimeout);
      this.comboTimeout = undefined;
    }

    if (this.queue.length === 0) {
      return;
    }

    const batch = this.queue.splice(0, this.queue.length);

    // 尝试 sendBeacon
    if (this.getUseSendBeacon()) {
      const models = batch.map((item) => this.addCacheExtension(item.model));
      const request = this.createCachedRequest(models);
      const beaconUrl = this.buildBeaconUrl(request.url);
      const sent = this.getNavigator()?.sendBeacon?.(beaconUrl, request.body) === true;
      if (sent) {
        this.forgetQueueKeys(batch);
        return;
      }
    }

    // fallback: 写缓存
    const models = batch.map((item) => this.addCacheExtension(item.model));
    const request = this.createCachedRequest(models);
    this.cacheRequests([request]);
  }

  /**
   * 自动注册页面离开检测 。
   * 调用后将自动 patch window.onbeforeunload。
   */
  detectLeave(): void {
    if (this.leavePatched || typeof window === "undefined") {
      return;
    }
    this.leavePatched = true;

    try {
      const origin = window.onbeforeunload;
      window.onbeforeunload = (() => {
        const cacheDisabled = this.getDisableCache();
        const useSendBeacon = this.getUseSendBeacon() && this.getNavigator()?.sendBeacon;

        if (!cacheDisabled || useSendBeacon) {
          // 1. 未进入上报流程的队列
          let cacheCombined = this.queue.map((item) => this.addCacheExtension(item.model));

          // 2. 上报流程未结束 — abort 并合并
          if (this.cacheSending.size) {
            for (const [, record] of this.cacheSending.entries()) {
              try {
                // 无法真正 abort Promise-based send，但我们可以将未完成的缓存合并
                if (record.cache.length) {
                  const models = record.cache.map((item) => this.addCacheExtension(item.model));
                  cacheCombined = cacheCombined.concat(models);
                }
              } catch {
                // ignore
              }
            }
            this.cacheSending.clear();
          }

          if (cacheCombined.length) {
            if (useSendBeacon) {
              const request = this.createCachedRequest(cacheCombined);
              const beaconUrl = this.buildBeaconUrl(request.url);
              this.getNavigator()?.sendBeacon?.(beaconUrl, request.body);
            } else if (!cacheDisabled) {
              const request = this.createCachedRequest(cacheCombined);
              appendErrorCache([request], this.getCacheOptions());
            }
          }

          // 清空队列
          this.queue.length = 0;
        }

        // 调用原始 handler
        if (origin) {
          (origin as () => void)();
        }
      }) as typeof window.onbeforeunload;
    } catch {
      // ignore
    }
  }

  /**
   * SDK 自身错误上报 。
   */
  reportSystemError(err: unknown, opts: ErrorAddOptions = {}): void {
    if (!err) return;
    try {
      const errObj = err as Error & { toString?: () => string };
      const model = createErrorModel({
        project: opts.tags?.project ?? this.getProject(),
        pageUrl: this.getPageUrl(),
        realUrl: this.getRealUrl(),
        category: opts.category ?? "jsError",
        sec_category: errObj.message || errObj.name || "parseError",
        level: opts.level ?? "error",
        unionId: this.getUnionId(),
        timestamp: Date.now(),
        content: errObj.stack ? JSON.stringify(errObj.stack) : (errObj.toString?.() ?? ""),
        traceid: traceId(),
        tags: opts.tags,
      });
      this.pushModel(model);
      void this.sendErrors(true);
    } catch (e) {
      // 静默处理，避免递归
    }
  }

  /**
   * SDK 自身 warn 上报 。
   */
  reportSystemWarn(err: unknown, opts: ErrorAddOptions = {}): void {
    if (!err) return;
    opts.level = "warn";
    opts.tags = opts.tags ?? {};
    this.reportSystemError(err, opts);
  }

  // ========== 私有方法 ==========

  /**
   * 内部 push 管线 。
   */
  private pushModel(model: ErrorModel): void {
    // 采样检查
    if (!this.cfgManager.isSampled("error")) {
      return;
    }

    // beforeSend / filter 钩子 (plugin-error 扩展)
    const prepared = this.applyFilters(model);
    if (!prepared) {
      return;
    }

    // noScriptError 过滤
    if (this.getNoScriptError() && String(prepared.sec_category).indexOf("Script error") === 0) {
      return;
    }

    // 运行 cfgManager.filters
    const filterFns = this.cfgManager.getConfig("filters");
    if (filterFns) {
      for (const name of Object.keys(filterFns)) {
        try {
          if (!this.cfgManager.runFilter(name, prepared)) {
            return;
          }
        } catch {
          // filter 异常视为通过
        }
      }
    }

    // ignoreList (string 前缀匹配，ignoreList.js)
    const errCfg = this.getErrorConfig();
    const ignoreList = errCfg.ignoreList;
    if (ignoreList && ignoreList.length) {
      for (const item of ignoreList) {
        if (typeof item === "string") {
          if (String(prepared.sec_category).indexOf(item) === 0) {
            return;
          }
        } else if (item instanceof RegExp) {
          item.lastIndex = 0;
          if (item.test(String(prepared.sec_category))) {
            return;
          }
        }
      }
    }

    // 内容长度检查
    if (this.getMaxSize() && String(prepared.content).length >= this.getMaxSize()) {
      return;
    }

    // 广播 monitorErrDetected 自定义事件
    this.dispatchErrorEvent(prepared);

    // 内容去重
    if (this.isExist(prepared)) {
      return;
    }

    // onErrorPush hook
    const handled = this._handleError(prepared);
    if (!handled) {
      return;
    }

    const key = this.createDedupeKey(handled);
    if (this.isDuplicate(key)) {
      return;
    }

    this.enqueue({ model: handled, key });
  }

  private _processError(errObj: Error): {
    category: string;
    sec_category: string;
    content: string;
    resourceUrl?: string;
    rowNum?: number;
    colNum?: number;
  } {
    const doFallback = (err: Error) => {
      const name = err.message || err.name || "Invalid_Error";
      const content = err.toString();
      return {
        category: "jsError",
        sec_category: name,
        content,
      };
    };

    const doParse = (err: Error) => {
      if (err.stack) {
        const parsed = parseErrorStack(err.stack);
        if (parsed) {
          return {
            category: "jsError",
            sec_category: err.message || err.name || "",
            content: err.stack,
            resourceUrl: parsed.resourceUrl,
            rowNum: parsed.rowNum,
            colNum: parsed.colNum,
          };
        }
      }
      return doFallback(err);
    };

    try {
      return doParse(errObj);
    } catch (e) {
      this.reportSystemError(e);
      return doFallback(errObj);
    }
  }

  private _handleError(instance: ErrorModel): ErrorModel | undefined {
    try {
      const hook = this.options.onErrorPush;
      if (typeof hook === "function") {
        const result = hook(instance);
        if (result === undefined) {
          return undefined;
        }
        return result;
      }
      return instance;
    } catch {
      return instance;
    }
  }

  /**
   * 内容去重：判断错误是否已存在当前队列中 。
   */
  private isExist(error: ErrorModel): boolean {
    for (const item of this.queue) {
      if (this.isModelEqual(item.model, error)) {
        return true;
      }
    }
    return false;
  }

  private isModelEqual(a: ErrorModel, b: ErrorModel): boolean {
    return (
      a.sec_category === b.sec_category &&
      a.resourceUrl === b.resourceUrl &&
      a.content === b.content &&
      a.dynamicMetric?.colNum === b.dynamicMetric?.colNum &&
      a.dynamicMetric?.rowNum === b.dynamicMetric?.rowNum
    );
  }

  /**
   * 限流检查 。
   */
  private checkRateLimit(): boolean {
    const maxNum = this.getMaxNum();
    const maxTime = this.options.maxTime ?? this.getErrorConfig().maxTime ?? DEFAULT_MAX_TIME;
    const timeSinceStart = Date.now() - this.timeLimit;

    if (!this.isTimeLimited) {
      this.timeLimit = Date.now();
    }
    this.isTimeLimited = true;

    this.errorCount += this.queue.length;

    if (timeSinceStart <= maxTime) {
      if (this.errorCount - this.queue.length >= maxNum) {
        return false;
      }
    } else {
      // 窗口过期，重置
      this.isTimeLimited = false;
      this.errorCount = 0;
    }

    return true;
  }

  /**
   * 合并 extension 数据到错误模型 。
   */
  private addCacheExtension(model: ErrorModel): ErrorModel {
    const ext = this.cfgManager.getExtensions();
    const extKeys = Object.keys(ext);
    if (extKeys.length === 0) {
      return model;
    }

    const enriched = { ...model };
    if (!enriched.dynamicMetric) {
      enriched.dynamicMetric = {};
    }
    enriched.dynamicMetric = { ...enriched.dynamicMetric, ...ext };
    return enriched;
  }

  /**
   * 广播 monitorErrDetected 自定义事件 。
   */
  private dispatchErrorEvent(model: ErrorModel): void {
    try {
      if (typeof window !== "undefined" && window.dispatchEvent) {
        const eventInfo: Record<string, unknown> = {
          project: model.project,
          pageUrl: model.pageUrl,
          category: model.category,
          sec_category: model.sec_category,
          level: model.level,
          unionId: model.unionId,
          pageId: this.getPageId() ?? "",
        };
        let errEvent: Event | undefined;
        if (typeof window.CustomEvent === "function") {
          errEvent = new CustomEvent("monitorErrDetected", {
            detail: eventInfo,
          });
        } else if (typeof document !== "undefined" && typeof document.createEvent === "function") {
          const evt = document.createEvent("CustomEvent");
          if (typeof evt.initCustomEvent === "function") {
            evt.initCustomEvent("monitorErrDetected", false, false, eventInfo);
            errEvent = evt as unknown as Event;
          }
        }
        if (errEvent) {
          window.dispatchEvent(errEvent);
        }
      }
    } catch {
      // ignore
    }
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
      unionId: options.unionId ?? this.getUnionId(),
      timestamp: Date.now(),
      content,
      traceid: traceId(),
      rowNum: options.rowNum,
      colNum: options.colNum,
      tags: options.tags,
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

  private enqueue(item: QueueItem): void {
    this.queue.push(item);
    this.recent.set(item.key, Date.now());
    if (this.queue.length >= this.getMaxNum()) {
      this.flushInBackground();
      return;
    }

    // combo 模式：延迟合并发送；非 combo 模式：立即发送
    if (this.getCombo()) {
      this.scheduleFlush();
    } else {
      this.flushInBackground();
    }
  }

  private scheduleFlush(): void {
    const delay = this.options.delay ?? this.getDelay();
    if (delay === -1 || this.flushTimer) {
      return;
    }

    this.flushTimer = setTimeout(() => {
      this.clearFlushTimer();
      this.flushInBackground();
    }, delay);
  }

  private clearFlushTimer(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  private flushInBackground(): void {
    void this.sendErrors(true).catch(() => {
      // sendErrors 已恢复队列或写入缓存
    });
  }

  private createCachedRequest(models: ErrorModel[]): CachedErrorRequest {
    return {
      url: this.cfgManager.getApiPath("log"),
      body: encodeErrorBody(models),
    };
  }

  /**
   * 构建 sendBeacon URL 。
   */
  private buildBeaconUrl(baseUrl: string): string {
    const pageId = this.getPageId();
    if (pageId) {
      const separator = baseUrl.includes("?") ? "&" : "?";
      return `${baseUrl}${separator}pageId=${encodeURIComponent(pageId)}&beacon=1`;
    }
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}beacon=1`;
  }

  private toTransportRequest(request: CachedErrorRequest): TransportRequest {
    return {
      method: "POST",
      url: request.url,
      body: request.body,
      headers: {
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
    };
  }

  private trySendBeacon(request: CachedErrorRequest): boolean {
    if (!this.options.useSendBeacon) {
      return false;
    }

    const beaconUrl = this.buildBeaconUrl(request.url);
    return this.getNavigator()?.sendBeacon?.(beaconUrl, request.body) === true;
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
    const baseKey = this.options.cacheKey ?? "__monitor_error_cache__";
    const webVersion = this.options.webVersion ?? this.cfgManager.getConfig("webVersion");
    return {
      key: webVersion ? `${baseKey}_${webVersion}` : baseKey,
      storage: this.options.storage,
    };
  }

  private getIgnoreList(): IgnoreItem[] {
    return [
      ...(this.cfgManager.getConfig("error").ignoreList as IgnoreItem[]),
      ...(this.options.ignoreList ?? []),
    ];
  }

  private getMaxSize(): number {
    return this.options.maxSize ?? this.getErrorConfig().maxSize ?? DEFAULT_MAX_SIZE;
  }

  private getMaxNum(): number {
    return (
      this.options.maxNum ?? this.cfgManager.getConfig("error").maxQueueLength ?? DEFAULT_MAX_NUM
    );
  }

  private getDelay(): number {
    return this.options.delay ?? this.getErrorConfig().delay ?? DEFAULT_DELAY;
  }

  private getNoScriptError(): boolean {
    return this.options.noScriptError ?? this.getErrorConfig().noScriptError ?? true;
  }

  private getFormatUnhandledRejection(): boolean {
    return (
      this.options.formatUnhandledRejection ??
      this.getErrorConfig().formatUnhandledRejection ??
      true
    );
  }

  private getUseSendBeacon(): boolean {
    return this.options.useSendBeacon === true;
  }

  private getDisableCache(): boolean {
    return this.options.disableCache ?? this.getErrorConfig().disableCache ?? true;
  }

  private getCombo(): boolean {
    return this.options.delay !== undefined
      ? this.options.delay !== -1
      : this.getErrorConfig().combo;
  }

  private getProject(): string {
    return this.cfgManager.getConfig("project");
  }

  private getPageUrl(): string {
    return this.options.pageUrl ?? getPageUrl();
  }

  private getRealUrl(): string {
    return this.options.realUrl ?? getPageUrl();
  }

  private getUnionId(): string | undefined {
    const ext = this.cfgManager.getExtensions();
    return ext["unionId"];
  }

  private getPageId(): string | undefined {
    return this.options.pageId ?? this.cfgManager.getExtensions()?.["pageId"];
  }

  private getErrorConfig() {
    return this.cfgManager.getConfig("error");
  }

  /**
   * 处理服务端下发的远程配置 。
   */
  private handleRemoteConfig(response: TransportResponse | void): void {
    if (!response || !response.body) return;
    try {
      const body = response.body as Record<string, unknown>;
      if (body && typeof body === "object" && body.sampling) {
        this.cfgManager.applyRemoteSampling(body.sampling as Record<string, number>);
      }
    } catch {
      // ignore
    }
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

  private rebuildQueueItems(models: ErrorModel[]): QueueItem[] {
    return models.map((model) => ({
      model,
      key: this.createDedupeKey(model),
    }));
  }
}

function getRuntimeNavigator(): BeaconNavigator | undefined {
  if (typeof globalThis.navigator === "undefined") {
    return undefined;
  }

  return globalThis.navigator;
}
