import { createMetricPlugin, type MetricManager } from "@monitor/plugin-metric";
import { createPagePlugin } from "@monitor/plugin-page";
import { PerfCache } from "@monitor/plugin-perf-cache";
import { createFsp2Plugin, type Fsp2Manager } from "@monitor/plugin-perf-fsp2";
import { createIrdPlugin } from "@monitor/plugin-perf-ird";
import { createShrPlugin } from "@monitor/plugin-perf-shr";
import { createPvPlugin, type PvManager } from "@monitor/plugin-pv";
import { createResourcePlugin } from "@monitor/plugin-resource";
import { createErrorPlugin } from "./error-plugin";
import type { MonitorClient } from "./monitor-client";

export interface DefaultPluginRefs {
  metric?: MetricManager;
  pv?: PvManager;
  fsp2?: Fsp2Manager;
}

export function registerDefaultPlugins(client: MonitorClient): DefaultPluginRefs {
  const refs: DefaultPluginRefs = {};
  const perfCache = new PerfCache();

  client
    .use(createErrorPlugin({ onReady: (manager) => client.attachErrorManager(manager) }))
    .use(createPagePlugin())
    .use(createResourcePlugin())
    .use(createPvPlugin({ onReady: (manager) => {
      refs.pv = manager;
      client.attachPvManager(manager);
    } }))
    .use(createMetricPlugin({ onReady: (manager) => {
      refs.metric = manager;
      client.attachMetricManager(manager);
    } }))
    .use(createFsp2Plugin({ cache: perfCache, onReady: (manager) => {
      refs.fsp2 = manager;
    } }))
    .use(createIrdPlugin({ cache: perfCache }))
    .use(createShrPlugin({ cache: perfCache }));

  return refs;
}
