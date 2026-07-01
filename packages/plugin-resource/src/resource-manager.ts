import { CfgManager, getPageUrl, traceId, type CoreConfigPatch } from "@monitor/core";
import {
  createResourceModel,
  encodeResourceJsonBatchBytes,
  encodeResourceProtobufBatch,
  encodeResourceTextBatch,
  type CreateResourceModelInput,
  type ResourceBatch,
  type ResourceModel,
} from "@monitor/protocol";
import type { TransportRequest, TransportResponse } from "@monitor/transport";

type SendFn = (request: TransportRequest) => Promise<TransportResponse | void>;
type OnBatchPush = (instance: ResourceModel) => boolean;

export interface ResourceManagerOptions extends CoreConfigPatch {
  send: SendFn;
  cfgManager?: CfgManager;
  pageUrl?: string;
  realUrl?: string;
  ctags?: Record<string, string>;
  onBatchPush?: OnBatchPush;
}

export interface ResourceCallInput {
  resourceUrl: string;
  type: string;
  connectType?: string;
  duration?: number;
  statusCode?: number;
  requestbyte?: number;
  responsebyte?: number;
  firstCategory?: string;
  secondCategory?: string;
  logContent?: string;
  timestamp?: number;
  ctags?: string | Record<string, string>;
}

const CACHE_SEND_TRIGGER = 5;

export class ResourceManager {
  private readonly cfgManager: CfgManager;
  private readonly send: SendFn;
  private readonly options: ResourceManagerOptions;
  private readonly queue: ResourceModel[] = [];
  private comboTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor(options: ResourceManagerOptions) {
    this.options = options;
    this.send = options.send;
    this.cfgManager = options.cfgManager ?? new CfgManager(options);
  }

  // ========== 公开方法 ==========

  /**
   * 添加静态资源调用记录 。
   */
  pushCall(input: ResourceCallInput): void {
    if (!this.cfgManager.isSampled("resource")) return;
    this.doPush(input);
  }

  /**
   * 添加 API 调用记录 。
   */
  pushApi(input: ResourceCallInput): void {
    if (!this.cfgManager.isSampled("api")) return;
    const ctags = typeof input.connectType === "object" ? input.connectType : this.options.ctags;
    this.doPush({ ...input, ctags: ctags as unknown as string });
  }

  /**
   * 快捷上报 。
   */
  report(input: ResourceCallInput): void {
    this.doPush(input);
    // combo 模式下 push 没有立即发送，这里补发
    if (this.getResourceConfig().combo) {
      this.triggerReport(true);
    }
  }

  async flush(): Promise<void> {
    await this.triggerReport(true);
  }

  // ========== 内部方法 ==========

  private doPush(input: ResourceCallInput): void {
    if (this.isReportUrl(input.resourceUrl)) {
      return;
    }

    const model = createResourceModel(this.createModelInput(input));
    const shouldPush = this.runOnBatchPush(model);
    if (!shouldPush) return;

    this.queue.push(model);
    const resCfg = this.getResourceConfig();

    if (resCfg.combo) {
      // combo 模式：达到阈值立即发，否则延迟合并
      if (this.queue.length >= CACHE_SEND_TRIGGER) {
        this.triggerReport(true);
      } else {
        this.triggerReport(false);
      }
    } else {
      // 非 combo 模式：每条立即发送
      this.triggerReport(true);
    }
  }

  private runOnBatchPush(model: ResourceModel): boolean {
    const hook = this.options.onBatchPush;
    if (typeof hook !== "function") return true;
    try {
      return hook(model);
    } catch {
      return true;
    }
  }

  private triggerReport(reportNow?: boolean): Promise<void> {
    const resCfg = this.getResourceConfig();
    const doCombo = () => {
      if (this.comboTimeout) {
        clearTimeout(this.comboTimeout);
        this.comboTimeout = undefined;
      }
      return this.sendBatch();
    };

    if (reportNow) {
      return this.sendBatch();
    } else if (!this.comboTimeout && resCfg.combo && resCfg.delay !== -1) {
      return new Promise<void>((resolve, reject) => {
        this.comboTimeout = setTimeout(() => {
          this.comboTimeout = undefined;
          doCombo().then(resolve).catch(reject);
        }, resCfg.delay);
      });
    }
    return Promise.resolve();
  }

  async sendBatch(): Promise<void> {
    if (this.queue.length === 0) return;

    const data = this.stringify();
    if (!data) return;

    const batch = this.queue.splice(0, this.queue.length);
    const devMode = this.cfgManager.getConfig("devMode");
    const buffer = devMode ? encodeResourceTextBatch(data) : encodeResourceProtobufBatchSafe(data);
    const body: BodyInit = typeof buffer === "string" ? buffer : new Blob([buffer as BlobPart]);
    const apiPath = this.cfgManager.getApiPath(devMode ? "batchTs" : "pbBatchTs");

    const pageId = this.cfgManager.getExtensions().pageId ?? "";
    const project = this.cfgManager.getConfig("project");

    try {
      const response = await this.send({
        method: "POST",
        url: `${apiPath}&pageId=${encodeURIComponent(pageId)}&p=${encodeURIComponent(project)}`,
        body,
        headers: {
          "content-type": devMode ? "application/json;charset=UTF-8" : "application/x-protobuf",
        },
      });
      this.handleRemoteConfig(response);
    } catch {
      // 失败时恢复队列
      this.queue.unshift(...batch);
      throw new Error("resource batch send failed");
    }
  }

  private stringify(): ResourceBatch | undefined {
    if (!this.queue.length) return undefined;
    const ext = this.cfgManager.getExtensions();
    return {
      infos: [...this.queue],
      region: ext.region ?? "",
      operator: ext.operator ?? "",
      network: ext.network ?? "",
      container: ext.container ?? "",
      os: ext.os ?? "",
      unionId: ext.unionId ?? "",
    };
  }

  isReportUrl(url: string): boolean {
    const baseUrl = this.cfgManager.getConfig("reportBaseUrl");
    return (
      (baseUrl !== "" && url.startsWith(baseUrl)) ||
      url.includes("/api/log") ||
      url.includes("/batchts")
    );
  }

  private createModelInput(input: ResourceCallInput): CreateResourceModelInput {
    const pageUrl = this.options.pageUrl ?? getPageUrl();
    return {
      project: this.cfgManager.getConfig("project"),
      pageUrl,
      realUrl: this.options.realUrl ?? pageUrl,
      resourceUrl: input.resourceUrl,
      connectType: input.connectType ?? "unknown",
      type: input.type,
      timestamp: input.timestamp,
      requestbyte: input.requestbyte,
      responsebyte: input.responsebyte,
      responsetime: input.duration,
      statusCode: input.statusCode,
      firstCategory: input.firstCategory,
      secondCategory: input.secondCategory,
      logContent: input.logContent,
      traceid: traceId(),
      ctags: input.ctags as string | Record<string, string> | undefined,
    };
  }

  private handleRemoteConfig(response: TransportResponse | void): void {
    if (!response?.body) return;
    try {
      const body = response.body as Record<string, unknown>;
      if (body && typeof body === "object" && body.sampling) {
        this.cfgManager.applyRemoteSampling(body.sampling as Record<string, number>);
      }
    } catch {
      // ignore
    }
  }

  private getResourceConfig() {
    return this.cfgManager.getConfig("resource");
  }
}

function encodeResourceProtobufBatchSafe(data: ResourceBatch): Uint8Array {
  try {
    return encodeResourceProtobufBatch(data);
  } catch {
    return encodeResourceJsonBatchBytes(data);
  }
}
