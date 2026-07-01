import { createLibConfig } from "@monitor/build-config";

export default createLibConfig({
  name: "MonitorPluginResource",
  external: ["@monitor/core", "@monitor/protocol", "@monitor/transport"],
});
