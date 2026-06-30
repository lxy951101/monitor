import { CfgManager, type CoreConfigPatch } from "@monitor/core";
import { createMetricPayload, type MetricItemInput, type MetricMap } from "@monitor/protocol";
import type { TransportRequest, TransportResponse } from "@monitor/transport";

type SendFn = (request: TransportRequest) => Promise<TransportResponse | void>;
type ReportErrorFn = (error: unknown) => void;

export interface MetricManagerOptions extends CoreConfigPatch {
  send: SendFn;
  cfgManager?: CfgManager;
  delay?: number;
  reportError?: ReportErrorFn;
  onError?: ReportErrorFn;
}

export class MetricManager {
  private readonly cfgManager: CfgManager;
  private readonly send: SendFn;
  private readonly reportError?: ReportErrorFn;
  private readonly delay: number;
  private readonly metrics: MetricItemInput[] = [];
  private readonly tags: MetricMap = {};
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(options: MetricManagerOptions) {
    this.cfgManager = options.cfgManager ?? new CfgManager(options);
    this.send = options.send;
    this.reportError = options.reportError ?? options.onError;
    this.delay = options.delay ?? 0;
  }

  setMetric(name: string, value: number, tags?: MetricMap, extra?: MetricMap): void {
    this.metrics.push({ name, value, tags, extra });
    if (this.delay > 0) {
      this.scheduleReport();
    }
  }

  setTags(tags: MetricMap): void {
    Object.assign(this.tags, tags);
  }

  setTag(key: string, value: string | number | boolean): void {
    this.tags[key] = value;
  }

  async report(): Promise<void> {
    this.clearTimer();
    if (this.metrics.length === 0) {
      return;
    }

    const batch = this.metrics.splice(0, this.metrics.length);
    if (!this.cfgManager.isSampled("metric")) {
      return;
    }

    try {
      await this.send(this.createRequest(batch));
    } catch (error) {
      this.metrics.unshift(...batch);
      this.reportError?.(error);
      throw error;
    }
  }

  private createRequest(metrics: MetricItemInput[]): TransportRequest {
    return {
      method: "POST",
      url: this.cfgManager.getApiPath("metricJTs"),
      body: JSON.stringify(
        createMetricPayload({
          tvs: this.createTvs(),
          metrics
        })
      ),
      headers: {
        "content-type": "application/json;charset=UTF-8"
      }
    };
  }

  private createTvs(): MetricMap {
    return {
      ...this.cfgManager.getConfig("metric").tags,
      ...this.tags
    };
  }

  private scheduleReport(): void {
    if (this.timer) {
      return;
    }

    this.timer = setTimeout(() => {
      void this.report().catch(() => {
        // report 已负责恢复队列和告警，后台路径只吞掉 rejection。
      });
    }, this.delay);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}
