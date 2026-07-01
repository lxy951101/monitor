import { createMetricPlugin, type MetricManager } from "@monitor/plugin-metric";
import { createPagePlugin } from "@monitor/plugin-page";
import { PerfCache } from "@monitor/plugin-perf-cache";
import { createFspPlugin, type FspManager } from "@monitor/plugin-perf-fsp";
import { createIrdPlugin } from "@monitor/plugin-perf-ird";
import { createShrPlugin } from "@monitor/plugin-perf-shr";
import { createPvPlugin, type PvManager } from "@monitor/plugin-pv";
import { createResourcePlugin } from "@monitor/plugin-resource";
import { createErrorPlugin } from "./error-plugin";
import type { MonitorClient } from "./monitor-client";

export interface DefaultPluginRefs {
 metric?: MetricManager;
 pv?: PvManager;
 fsp?: FspManager;
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
  .use(createFspPlugin({ cache: perfCache, onReady: (manager) => {
   refs.fsp = manager;
  } }))
  .use(createIrdPlugin({ cache: perfCache }))
  .use(createShrPlugin({ cache: perfCache }));

 return refs;
}
