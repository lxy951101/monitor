import { describe, expect, it, vi } from "vitest";
import { CfgManager, EventBus, Logger } from "@monitor/core";
import { createResourcePlugin } from "./index";

describe("createResourcePlugin", () => {
 it("启动资源 entry 和加载错误采集，stop 后清理监听", async () => {
  const send = vi.fn().mockResolvedValue(undefined);
  const listeners = new Map<string, EventListener>();
  const targetWindow = {
   performance: {
    getEntriesByType: () => [
     { name: "/app.js", initiatorType: "script", duration: 8 }
    ]
   },
   addEventListener: vi.fn(
    (name: string, listener: EventListener) =>
     listeners.set(name, listener)
   ),
   removeEventListener: vi.fn()
  };
  const plugin = createResourcePlugin({
   window: targetWindow,
   pageUrl: "/home"
  });

  plugin.start({
   cfgManager: new CfgManager({
    project: "demo",
    reportBaseUrl: "",
    devMode: true,
    resource: { sample: 1, sampleApi: 1, combo: false }
   }),
   eventBus: new EventBus(),
   logger: new Logger(false),
   transport: { send }
  });
  listeners.get("error")?.({
   target: {
    nodeName: "SCRIPT",
    getAttribute: (name: string) =>
     name === "src" ? "/missing.js" : null
   }
  } as unknown as Event);
  // 等待异步 send 完成
  await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(2), { timeout: 1000 });
  plugin.stop?.();

  expect(send).toHaveBeenCalledWith(
   expect.objectContaining({
    body: expect.stringContaining("/app.js")
   })
  );
  expect(send).toHaveBeenCalledWith(
   expect.objectContaining({
    body: expect.stringContaining("/missing.js")
   })
  );
  expect(targetWindow.removeEventListener).toHaveBeenCalledWith(
   "error",
   expect.any(Function),
   true
  );
 });
});
