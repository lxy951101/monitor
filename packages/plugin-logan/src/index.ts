import type { MonitorContext, Plugin } from "@monitor/core";
import { LoganManager, type LoganManagerOptions } from "./logan-manager";

export const packageName = "@monitor/plugin-logan";

export interface LoganPluginOptions extends LoganManagerOptions {
  onReady?: (manager: LoganManager) => void;
}

export function createLoganPlugin(options: LoganPluginOptions = {}): Plugin {
  let manager: LoganManager | undefined;

  return {
    name: packageName,
    start(context: MonitorContext) {
      const config = context.cfgManager.getConfig("logan");
      manager = new LoganManager({
        ...options,
        version: options.version ?? config.version,
        cdnPrefixes: options.cdnPrefixes ?? config.cdnPrefixes,
        autoLoad: options.autoLoad ?? (config.enable && config.autoLoad)
      });
      options.onReady?.(manager);
      void manager.start().catch((error) => context.logger.warn("logan load failed", error));
    },
    stop() {
      manager = undefined;
    }
  };
}

export * from "./load-script";
export * from "./logan-manager";
