import { createLibConfig } from "@monitor/build-config";

export default createLibConfig({
  name: "MonitorPluginError",
  external: ["@monitor/core", "@monitor/protocol", "@monitor/transport"],
});
