import { describe, expect, it, vi } from "vitest";
import { EventBus, Logger, MonitorCore, type MonitorContext, type Plugin } from "./index";

describe("MonitorCore", () => {
 it("按顺序启动插件并暴露 API", () => {
  const start = vi.fn();
  const monitor = new MonitorCore({ project: "demo" });

  monitor.use({ name: "demo", start });
  monitor.start();

  expect(start).toHaveBeenCalledTimes(1);
  expect(monitor.getConfig("project")).toBe("demo");
 });

 it("通过 setConfig 暴露单项配置更新", () => {
  const monitor = new MonitorCore({ project: "demo" });

  monitor.setConfig("project", "next");

  expect(monitor.getConfig("project")).toBe("next");
 });

 it("重复 start 不重复启动插件，stop 按反序停止并可重新启动", () => {
  const calls: string[] = [];
  const monitor = new MonitorCore({ project: "demo" });
  const first: Plugin = {
   name: "first",
   start: () => calls.push("start:first"),
   stop: () => calls.push("stop:first")
  };
  const second: Plugin = {
   name: "second",
   start: () => calls.push("start:second"),
   stop: () => calls.push("stop:second")
  };

  monitor.use(first).use(second);
  monitor.start();
  monitor.start();
  monitor.stop();
  monitor.start();

  expect(calls).toEqual([
   "start:first",
   "start:second",
   "stop:second",
   "stop:first",
   "start:first",
   "start:second"
  ]);
 });

 it("插件 start 接收 cfgManager、eventBus、transport、logger", () => {
  const start = vi.fn<(context: MonitorContext) => void>();
  const transport = { send: vi.fn().mockResolvedValue({ ok: true, status: 204 }) };
  const eventBus = new EventBus();
  const logger = new Logger(true);
  const monitor = new MonitorCore({ project: "demo" }, { eventBus, logger, transport });

  monitor.use({ name: "context", start });
  monitor.start();

  expect(start.mock.calls[0]?.[0].cfgManager.getConfig("project")).toBe("demo");
  expect(start.mock.calls[0]?.[0].eventBus).toBe(eventBus);
  expect(start.mock.calls[0]?.[0].transport).toBe(transport);
  expect(start.mock.calls[0]?.[0].logger).toBe(logger);
 });
});
