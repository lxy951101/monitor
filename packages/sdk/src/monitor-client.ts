import { MonitorCore, type CoreConfig, type CoreConfigPatch, type Plugin } from "@monitor/core";
import type { ErrorManager } from "@monitor/plugin-error";
import type { MetricManager } from "@monitor/plugin-metric";
import type { PvManager, PvReportOptions, PvResetOptions } from "@monitor/plugin-pv";
import type { MetricMap } from "@monitor/protocol";
import { createXhrTransport, type Transport } from "@monitor/transport";
import { registerDefaultPlugins } from "./register-defaults";

export interface MonitorClientOptions {
  config?: CoreConfigPatch;
  transport?: Transport;
  registerDefaults?: boolean;
}

export class MonitorClient {
  readonly core: MonitorCore;
  private errorManager: ErrorManager | undefined;
  private metricManager: MetricManager | undefined;
  private pvManager: PvManager | undefined;

  constructor(options: MonitorClientOptions = {}) {
    this.core = new MonitorCore(options.config, {
      transport: options.transport ?? createXhrTransport()
    });
    if (options.registerDefaults !== false) {
      registerDefaultPlugins(this);
    }
  }

  use(plugin: Plugin): this {
    this.core.use(plugin);
    return this;
  }

  init(config?: CoreConfigPatch): this {
    return this.start(config);
  }

  start(config?: CoreConfigPatch): this {
    this.core.start(config);
    return this;
  }

  stop(): this {
    this.core.stop();
    return this;
  }

  config(config: CoreConfigPatch): this {
    this.core.config(config);
    return this;
  }

  setConfig<Key extends keyof CoreConfig>(key: Key, value: CoreConfig[Key]): this {
    this.core.setConfig(key, value);
    return this;
  }

  getConfig(): CoreConfig;
  getConfig<Key extends keyof CoreConfig>(key: Key): CoreConfig[Key];
  getConfig<Key extends keyof CoreConfig>(key?: Key): CoreConfig | CoreConfig[Key] {
    return key === undefined ? this.core.getConfig() : this.core.getConfig(key);
  }

  reportError(error: unknown, options?: Parameters<ErrorManager["addError"]>[1]): this {
    this.errorManager?.addError(error, options);
    return this;
  }

  reportPv(options?: PvReportOptions): this {
    void this.pvManager?.report(options);
    return this;
  }

  resetPv(options?: PvResetOptions): this {
    this.pvManager?.resetPv(options);
    return this;
  }

  setMetric(name: string, value: number, tags?: MetricMap, extra?: MetricMap): this {
    this.metricManager?.setMetric(name, value, tags, extra);
    return this;
  }

  setTags(tags: MetricMap): this {
    this.metricManager?.setTags(tags);
    return this;
  }

  setTag(key: string, value: string | number | boolean): this {
    this.metricManager?.setTag(key, value);
    return this;
  }

  async reportMetric(): Promise<void> {
    await this.metricManager?.report();
  }

  attachErrorManager(manager: ErrorManager): void {
    this.errorManager = manager;
  }

  attachMetricManager(manager: MetricManager): void {
    this.metricManager = manager;
  }

  attachPvManager(manager: PvManager): void {
    this.pvManager = manager;
  }
}
