import { createLibConfig } from "@monitor/build-config";

export default createLibConfig({
  name: "MonitorPluginPerfShr",
  external: [
    "@monitor/core",
    "@monitor/plugin-perf-cache",
    "@monitor/protocol",
    "@monitor/transport",
  ],
});
