import type { Transport } from "@monitor/transport";
import type { CfgManager } from "./config-manager";
import type { EventBus } from "./event-bus";
import type { Logger } from "./logger";

export interface MonitorContext {
  cfgManager: CfgManager;
  eventBus: EventBus;
  transport: Transport;
  logger: Logger;
}

export interface Plugin {
  name: string;
  start: (context: MonitorContext) => void;
  stop?: (context?: MonitorContext) => void;
}
