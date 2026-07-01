import type { MonitorContext, Plugin } from "@monitor/core";
import { MetricManager, type MetricManagerOptions } from "./metric-manager";

export const packageName = "@monitor/plugin-metric";

export interface MetricPluginOptions extends Omit<Partial<MetricManagerOptions>, "send" | "cfgManager"> {
 onReady?: (manager: MetricManager) => void;
}

export function createMetricPlugin(options: MetricPluginOptions = {}): Plugin {
 let manager: MetricManager | undefined;

 return {
  name: packageName,
  start(context: MonitorContext) {
   manager = new MetricManager({
    ...options,
    cfgManager: context.cfgManager,
    send: context.transport.send.bind(context.transport)
   });
   options.onReady?.(manager);
  },
  stop() {
   manager = undefined;
  }
 };
}

export { MetricManager, type MetricManagerOptions } from "./metric-manager";
