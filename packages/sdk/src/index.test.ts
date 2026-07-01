import { describe, expect, it, vi } from "vitest";
import { installGlobal, Monitor, MonitorClient, type MonitorGlobalTarget } from "./index";

describe("聚合 SDK", () => {
 it("默认导出 Monitor 和 MonitorClient", () => {
  expect(Monitor).toBeDefined();
  expect(MonitorClient).toBeDefined();
  expect(Monitor.__version__).toMatch(/\d+\.\d+\.\d+/);
 });

 it("MonitorClient 暴露配置、插件和指标接口", async () => {
  const send = vi.fn().mockResolvedValue({ ok: true, status: 204 });
  const client = new MonitorClient({
   registerDefaults: false,
   transport: { send },
   config: { project: "demo" }
  });

  client.config({ metric: { sample: 1 } }).start();

  expect(client.getConfig("project")).toBe("demo");
  await expect(client.reportMetric()).resolves.toBeUndefined();
 });

 it("全局入口接管 monitor 队列", () => {
  const target: MonitorGlobalTarget = {
   monitor: [["init", { project: "queued" }]],
   _Monitor_: [["stop"]]
  };
  const client = new MonitorClient({ registerDefaults: false });

  const monitor = installGlobal({ target, client });

  expect(monitor).toBeDefined();
  expect(target.Monitor).toBe(monitor);
  expect(client.getConfig("project")).toBe("queued");
  expect(client.core.isStarted()).toBe(false);
 });
});
