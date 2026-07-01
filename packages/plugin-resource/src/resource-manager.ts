import { CfgManager, getPageUrl, traceId, type CoreConfigPatch } from "@monitor/core";
import {
  createResourceModel,
  encodeResourceTextBatch,
  type CreateResourceModelInput,
  type ResourceModel
} from "@monitor/protocol";
import type { TransportRequest, TransportResponse } from "@monitor/transport";

type SendFn = (request: TransportRequest) => Promise<TransportResponse | void>;

export interface ResourceManagerOptions extends CoreConfigPatch {
  send: SendFn;
  cfgManager?: CfgManager;
  pageUrl?: string;
  realUrl?: string;
  ctags?: Record<string, string>;
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
}

export class ResourceManager {
  private readonly cfgManager: CfgManager;
  private readonly send: SendFn;
  private readonly options: ResourceManagerOptions;
  private readonly queue: ResourceModel[] = [];

  constructor(options: ResourceManagerOptions) {
    this.options = options;
    this.send = options.send;
    this.cfgManager = options.cfgManager ?? new CfgManager(options);
  }

  addCall(input: ResourceCallInput): void {
    if (this.isReportUrl(input.resourceUrl)) {
      return;
    }

    this.queue.push(createResourceModel(this.createModelInput(input)));
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    const batch = this.queue.splice(0, this.queue.length);
    try {
      await this.send(this.createRequest(batch));
    } catch (error) {
      this.queue.unshift(...batch);
      throw error;
    }
  }

  reportCall(input: ResourceCallInput): Promise<void> {
    this.addCall(input);
    return this.flush();
  }

  isReportUrl(url: string): boolean {
    const baseUrl = this.cfgManager.getConfig("reportBaseUrl");
    return (baseUrl !== "" && url.startsWith(baseUrl)) || url.includes("/api/log") || url.includes("/batchts");
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
      ctags: this.options.ctags
    };
  }

  private createRequest(models: ResourceModel[]): TransportRequest {
    return {
      method: "POST",
      url: this.cfgManager.getApiPath("batchTs"),
      body: encodeResourceTextBatch({ infos: models }),
      headers: {
        "content-type": "application/json;charset=UTF-8"
      }
    };
  }
}
