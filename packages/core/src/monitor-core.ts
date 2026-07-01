import type { Transport, TransportRequest, TransportResponse } from "@monitor/transport";
import { CfgManager, type MonitorCoreConfigPatch } from "./config-manager";
import { EventBus, type EventMap } from "./event-bus";
import { Logger } from "./logger";
import type { MonitorContext, Plugin } from "./plugin";

export interface MonitorCoreOptions<Events extends EventMap = Record<string, unknown[]>> {
  cfgManager?: CfgManager;
  eventBus?: EventBus<Events>;
  logger?: Logger;
  transport?: Transport;
}

export class MonitorCore<Events extends EventMap = Record<string, unknown[]>> {
  readonly cfgManager: CfgManager;
  readonly eventBus: EventBus<Events>;
  readonly logger: Logger;
  readonly transport: Transport;

  private readonly plugins: Array<Plugin<Events>> = [];
  private readonly startedPlugins: Array<Plugin<Events>> = [];
  private started = false;

  constructor(config: MonitorCoreConfigPatch = {}, options: MonitorCoreOptions<Events> = {}) {
    this.cfgManager = options.cfgManager ?? new CfgManager(config);
    this.eventBus = options.eventBus ?? new EventBus<Events>();
    this.logger = options.logger ?? new Logger(Boolean(this.cfgManager.getConfig("devMode")));
    this.transport = options.transport ?? new NoopTransport();
  }

  use(plugin: Plugin<Events>): this {
    this.plugins.push(plugin);

    if (this.started) {
      this.startPlugin(plugin);
    }

    return this;
  }

  start(): this {
    if (this.started) {
      return this;
    }

    this.started = true;

    for (const plugin of this.plugins) {
      this.startPlugin(plugin);
    }

    return this;
  }

  stop(): this {
    if (!this.started) {
      return this;
    }

    for (const plugin of [...this.startedPlugins].reverse()) {
      this.stopPlugin(plugin);
    }

    this.startedPlugins.length = 0;
    this.started = false;
    return this;
  }

  getConfig<Key extends keyof CfgManager["config"]>(key: Key): CfgManager["config"][Key] {
    return this.cfgManager.getConfig(key);
  }

  setConfig<Key extends keyof CfgManager["config"]>(
    key: Key,
    value: CfgManager["config"][Key]
  ): this {
    this.cfgManager.setConfig(key, value);

    if (key === "devMode") {
      this.logger.setDevMode(Boolean(value));
    }

    return this;
  }

  updateConfig(config: MonitorCoreConfigPatch): this {
    this.cfgManager.updateConfig(config);
    this.logger.setDevMode(Boolean(this.cfgManager.getConfig("devMode")));
    return this;
  }

  private createContext(): MonitorContext<Events> {
    return {
      cfgManager: this.cfgManager,
      eventBus: this.eventBus,
      transport: this.transport,
      logger: this.logger
    };
  }

  private startPlugin(plugin: Plugin<Events>): void {
    if (this.startedPlugins.includes(plugin)) {
      return;
    }

    try {
      plugin.start(this.createContext());
      this.startedPlugins.push(plugin);
    } catch (error) {
      this.logger.error(`[MonitorCore] plugin ${plugin.name} start failed`, error);
    }
  }

  private stopPlugin(plugin: Plugin<Events>): void {
    try {
      plugin.stop?.(this.createContext());
    } catch (error) {
      this.logger.error(`[MonitorCore] plugin ${plugin.name} stop failed`, error);
    }
  }
}

class NoopTransport implements Transport {
  send(_request: TransportRequest): Promise<TransportResponse> {
    return Promise.resolve({ ok: true, status: 204 });
  }
}
