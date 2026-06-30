import type { Transport } from "@monitor/transport";
import { CfgManager, type CoreConfig, type CoreConfigPatch } from "./config-manager";
import { EventBus } from "./event-bus";
import { Logger } from "./logger";
import type { MonitorContext, Plugin } from "./plugin";

export interface MonitorCoreOptions {
  eventBus?: EventBus;
  logger?: Logger;
  transport?: Transport;
}

const noopTransport: Transport = {
  async send() {
    return { ok: true, status: 204 };
  }
};

export class MonitorCore {
  readonly cfgManager: CfgManager;
  readonly eventBus: EventBus;
  readonly logger: Logger;
  readonly transport: Transport;
  private readonly plugins: Plugin[] = [];
  private started = false;

  constructor(config: CoreConfigPatch = {}, options: MonitorCoreOptions = {}) {
    this.cfgManager = new CfgManager(config);
    this.eventBus = options.eventBus ?? new EventBus();
    this.logger = options.logger ?? new Logger(this.cfgManager.getConfig("devMode"));
    this.transport = options.transport ?? noopTransport;
  }

  use(plugin: Plugin): this {
    this.plugins.push(plugin);

    if (this.started) {
      plugin.start(this.createContext());
    }

    return this;
  }

  start(config?: CoreConfigPatch): this {
    if (config) {
      this.config(config);
    }

    if (this.started) {
      return this;
    }

    this.started = true;
    const context = this.createContext();

    for (const plugin of this.plugins) {
      plugin.start(context);
    }

    return this;
  }

  stop(): this {
    if (!this.started) {
      return this;
    }

    const context = this.createContext();

    for (const plugin of [...this.plugins].reverse()) {
      plugin.stop?.(context);
    }

    this.eventBus.clear();
    this.started = false;
    return this;
  }

  config(config: CoreConfigPatch): this {
    this.cfgManager.updateConfig(config);
    this.logger.setDevMode(this.cfgManager.getConfig("devMode"));
    return this;
  }

  setConfig<Key extends keyof CoreConfig>(key: Key, value: CoreConfig[Key]): this {
    this.cfgManager.setConfig(key, value);
    this.logger.setDevMode(this.cfgManager.getConfig("devMode"));
    return this;
  }

  getConfig(): CoreConfig;
  getConfig<Key extends keyof CoreConfig>(key: Key): CoreConfig[Key];
  getConfig<Key extends keyof CoreConfig>(key?: Key): CoreConfig | CoreConfig[Key] {
    if (key === undefined) {
      return this.cfgManager.getConfig();
    }

    return this.cfgManager.getConfig(key);
  }

  isStarted(): boolean {
    return this.started;
  }

  private createContext(): MonitorContext {
    return {
      cfgManager: this.cfgManager,
      eventBus: this.eventBus,
      transport: this.transport,
      logger: this.logger
    };
  }
}
