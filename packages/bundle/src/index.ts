import { createMonitorNamespace, MonitorClient, registerDefaultPlugins } from "@monitor/sdk";

const client = new MonitorClient();
registerDefaultPlugins(client);

const Monitor = createMonitorNamespace(client);

(window as any).Monitor = Monitor;

export { Monitor };
