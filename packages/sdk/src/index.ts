import type { CoreConfigPatch } from "@monitor/core";
import { MonitorClient } from "./monitor-client";

export const packageName = "@monitor/sdk";
export const version = "0.0.0";

export interface MonitorNamespace {
  __version__: string;
  create: (config?: CoreConfigPatch) => MonitorClient;
  init: (config?: CoreConfigPatch) => MonitorClient;
  start: (config?: CoreConfigPatch) => MonitorClient;
  stop: () => MonitorClient;
  debug: () => MonitorClient;
  /** 用 try-catch 包裹函数，异常时自动上报 error 然后继续抛出。防止重复包裹。 */
  wrap: <T extends (...args: never[]) => unknown>(fn: T) => T;
  client: MonitorClient;
}

export function createMonitorNamespace(client = new MonitorClient()): MonitorNamespace {
  return {
    __version__: version,
    client,
    create(config?: CoreConfigPatch) {
      return new MonitorClient({ config });
    },
    init(config?: CoreConfigPatch) {
      return client.init(config);
    },
    start(config?: CoreConfigPatch) {
      return client.start(config);
    },
    stop() {
      return client.stop();
    },
    debug() {
      return client.debug();
    },
    wrap<T extends (...args: never[]) => unknown>(fn: T): T {
      return client.wrap(fn);
    },
  };
}

export const Monitor = createMonitorNamespace();

export { installGlobal, type InstallGlobalOptions, type MonitorGlobalTarget } from "./global";
export { MonitorClient, type MonitorClientOptions } from "./monitor-client";
export { registerDefaultPlugins, type DefaultPluginRefs } from "./register-defaults";
