import { createLibConfig } from "@monitor/build-config";

export default createLibConfig({
  name: "MonitorTransport",
  external: ["@monitor/config", "@monitor/protocol"],
});
