import { createLibConfig } from "@monitor/build-config";

export default createLibConfig({
  name: "MonitorCore",
  external: ["@monitor/config", "@monitor/protocol", "@monitor/transport"],
});
