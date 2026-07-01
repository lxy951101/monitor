import type { Transport } from "@monitor/transport";
import type { CfgManager } from "./config-manager";
import type { EventBus, EventMap } from "./event-bus";
import type { Logger } from "./logger";

export interface MonitorContext<Events extends EventMap = Record<string, unknown[]>> {
  cfgManager: CfgManager;
  eventBus: EventBus<Events>;
  transport: Transport;
  logger: Logger;
}

export interface Plugin<Events extends EventMap = Record<string, unknown[]>> {
  name: string;
  start(context: MonitorContext<Events>): void;
  stop?(context?: MonitorContext<Events>): void;
}
