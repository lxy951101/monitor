import { CfgManager, getPageUrl, type CoreConfigPatch } from "@monitor/core";
import { createPvModel, encodePvQuery, type CreatePvModelInput } from "@monitor/protocol";
import type { TransportRequest, TransportResponse } from "@monitor/transport";

type SendFn = (request: TransportRequest) => Promise<TransportResponse | void>;
type Ctags = Record<string, string>;

export interface PvReportOptions {
 pageUrl?: string;
 pageId?: string;
 ctags?: string | Ctags;
 timestamp?: number;
 region?: string;
 operator?: string;
 network?: string;
 container?: string;
 os?: string;
 unionid?: string;
 /** 200ms 防抖：快速连续调用时只上报最后一次。SPA 路由切换时使用。 */
 delay?: boolean;
}

export interface PvResetOptions {
 pageUrl?: string;
 pageId?: string;
 ctags?: string | Ctags;
}

export interface PvManagerOptions extends CoreConfigPatch {
 send: SendFn;
 cfgManager?: CfgManager;
 pageUrl?: string;
 pageId?: string;
 ctags?: string | Ctags;
 autoReport?: boolean;
 env?: Parameters<typeof getPageUrl>[0];
 /** PV 上报成功后的回调，可用于处理服务端下发的远程配置 */
 onResponse?: (response: TransportResponse, cfgManager: CfgManager) => void;
}

export class PvManager {
 private readonly cfgManager: CfgManager;
 private readonly send: SendFn;
 private readonly options: PvManagerOptions;
 private pageUrl: string | undefined;
 private pageId: string | undefined;
 private ctags: string | Ctags | undefined;
 private started = false;
 private delayTimer: ReturnType<typeof setTimeout> | undefined;

 constructor(options: PvManagerOptions) {
  this.options = options;
  this.send = options.send;
  this.cfgManager = options.cfgManager ?? new CfgManager(options);
  this.pageUrl = options.pageUrl;
  this.pageId = options.pageId;
  this.ctags = options.ctags;
 }

 start(): void {
  if (this.started) {
   return;
  }

  this.started = true;
  if (this.options.autoReport !== false) {
   this.reportInBackground();
  }
 }

 stop(): void {
  this.started = false;
  if (this.delayTimer !== undefined) {
   clearTimeout(this.delayTimer);
   this.delayTimer = undefined;
  }
 }

 resetPv(options: PvResetOptions = {}): void {
  if (options.pageUrl !== undefined) {
   this.pageUrl = options.pageUrl;
  }
  if (options.pageId !== undefined) {
   this.pageId = options.pageId;
  }
  if (options.ctags !== undefined) {
   this.ctags = options.ctags;
  }
 }

 async report(options: PvReportOptions = {}): Promise<void> {
  // 200ms 防抖：快速连续调用时只上报最后一次
  if (options.delay) {
   if (this.delayTimer !== undefined) {
    clearTimeout(this.delayTimer);
   }
   return new Promise<void>((resolve) => {
    this.delayTimer = setTimeout(() => {
     this.delayTimer = undefined;
     resolve(this.report({ ...options, delay: false }));
    }, 200);
   });
  }

  const model = createPvModel(this.createModelInput(options));
  const query = encodePvQuery(model);

  const response = await this.send({
   method: "POST",
   url: this.cfgManager.getApiPath("pvTs"),
   headers: { "Content-Type": "application/x-www-form-urlencoded" },
   body: query
  });

  if (response) {
   this.options.onResponse?.(response, this.cfgManager);
  }
 }

 private createModelInput(options: PvReportOptions): CreatePvModelInput {
  return {
   project: this.cfgManager.getConfig("project"),
   pageurl: options.pageUrl ?? this.pageUrl ?? getPageUrl(this.options.env),
   pageId: options.pageId ?? this.pageId,
   timestamp: options.timestamp,
   region: options.region,
   operator: options.operator,
   network: options.network,
   container: options.container,
   os: options.os,
   unionid: options.unionid,
   ctags: mergeCtags(this.ctags, options.ctags)
  };
 }

 private reportInBackground(): void {
  void this.report().catch(() => {
   // 自动 PV 的后台发送失败不应产生未处理 rejection。
  });
 }
}

export function reportPv(manager: PvManager, options: PvReportOptions = {}): Promise<void> {
 return manager.report(options);
}

function mergeCtags(base: string | Ctags | undefined, patch: string | Ctags | undefined): string | Ctags | undefined {
 if (patch === undefined) {
  return base;
 }
 if (base === undefined || typeof base === "string" || typeof patch === "string") {
  return patch;
 }
 return { ...base, ...patch };
}
