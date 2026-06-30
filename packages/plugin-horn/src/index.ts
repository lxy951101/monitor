import type { MonitorContext, Plugin } from "@monitor/core";
import { HornManager } from "./horn-manager";

export const packageName = "@monitor/plugin-horn";

export interface HornPluginOptions {
  key?: string;
  ttl?: number;
  fetcher?: (url: string) => Promise<unknown>;
}

export function createHornPlugin(options: HornPluginOptions = {}): Plugin {
  return {
    name: packageName,
    start(context: MonitorContext) {
      const key = options.key ?? context.cfgManager.getConfig("project");
      if (!key) {
        return;
      }

      const manager = new HornManager({
        key,
        project: context.cfgManager.getConfig("project"),
        hornUrl: context.cfgManager.getConfig("hornUrl"),
        ttl: options.ttl,
        fetcher: options.fetcher,
        useMSI: context.cfgManager.getConfig("bridge").useMSI
      });
      void manager.getConfig<Record<string, unknown>>().then((config) => {
        if (isSamplingPatch(config.sampling)) {
          context.cfgManager.applyRemoteSampling(config.sampling);
        }
      }).catch((error) => context.logger.warn("horn config load failed", error));
    }
  };
}

function isSamplingPatch(value: unknown): value is Parameters<MonitorContext["cfgManager"]["applyRemoteSampling"]>[0] {
  return value !== null && typeof value === "object";
}

export * from "./horn-manager";
