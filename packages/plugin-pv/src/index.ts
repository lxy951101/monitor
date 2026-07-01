import type { MonitorContext, Plugin } from "@monitor/core";
import { PvManager, type PvManagerOptions } from "./pv-manager";
import { startSpaPv, type SpaPvOptions } from "./spa";

export const packageName = "@monitor/plugin-pv";

export interface PvPluginOptions extends Omit<Partial<PvManagerOptions>, "send" | "cfgManager"> {
 spa?: boolean | SpaPvOptions;
 onReady?: (manager: PvManager) => void;
}

export function createPvPlugin(options: PvPluginOptions = {}): Plugin {
 let manager: PvManager | undefined;
 let stopSpa: (() => void) | undefined;

 return {
  name: packageName,
  start(context: MonitorContext) {
   manager = new PvManager({
    ...options,
    cfgManager: context.cfgManager,
    send: context.transport.send.bind(context.transport),
    autoReport: options.autoReport ?? context.cfgManager.getConfig("autoCatch").pv
   });
   options.onReady?.(manager);
   manager.start();

   if (shouldStartSpa(context, options)) {
    stopSpa = startSpaPv(manager, createSpaOptions(context, options));
   }
  },
  stop() {
   stopSpa?.();
   stopSpa = undefined;
   manager?.stop();
   manager = undefined;
  }
 };
}

function shouldStartSpa(context: MonitorContext, options: PvPluginOptions): boolean {
 if (options.spa === false) {
  return false;
 }

 const config = context.cfgManager.getConfig("SPA");
 return config.enable && config.autoPv;
}

function createSpaOptions(context: MonitorContext, options: PvPluginOptions): SpaPvOptions {
 const config = context.cfgManager.getConfig("SPA");
 return {
  routeMode: config.routeMode,
  ...(typeof options.spa === "object" ? options.spa : {})
 };
}

export { PvManager, reportPv, type PvManagerOptions, type PvReportOptions, type PvResetOptions } from "./pv-manager";
export { startSpaPv, type SpaPvOptions, type WatchRoute } from "./spa";
