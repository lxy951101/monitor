import { createLibConfig } from "@monitor/build-config";

export default createLibConfig({
  name: "MonitorSdk",
  external: [
    "@monitor/core",
    "@monitor/plugin-error",
    "@monitor/plugin-resource",
    "@monitor/plugin-page",
    "@monitor/plugin-pv",
    "@monitor/plugin-metric",
    "@monitor/plugin-perf-fsp",
    "@monitor/plugin-perf-ird",
    "@monitor/plugin-perf-shr",
    "@monitor/plugin-perf-cache",
    "@monitor/transport",
  ],
});
