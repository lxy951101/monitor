import { describe, expect, it, vi } from "vitest";
import { CfgManager, EventBus, Logger } from "@monitor/core";
import { createHornPlugin, HornManager } from "./index";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key))
  };
}

describe("HornManager", () => {
  it("构建带 key/project 的通用 URL，不包含特定容器参数", () => {
    const manager = new HornManager({ key: "demo", project: "monitor" });

    expect(manager.buildUrl()).toContain("key=demo");
    expect(manager.buildUrl()).toContain("project=monitor");
  });

  it("读取有效缓存，过期后刷新远端并写入 _sdkHorn_<key>", async () => {
    const storage = createStorage();
    const fetcher = vi.fn().mockResolvedValue({ sample: 0.5 });
    let now = 100;
    const manager = new HornManager({ key: "demo", storage, fetcher, now: () => now, ttl: 10 });

    await expect(manager.getConfig()).resolves.toEqual({ sample: 0.5 });
    await expect(manager.getConfig()).resolves.toEqual({ sample: 0.5 });
    now = 111;
    fetcher.mockResolvedValueOnce({ sample: 1 });
    await expect(manager.getConfig()).resolves.toEqual({ sample: 1 });

    expect(storage.setItem.mock.calls[0][0]).toBe("_sdkHorn_demo");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("缓存写入失败时仍返回远端配置", async () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error("quota exceeded");
      }),
      removeItem: vi.fn()
    };
    const manager = new HornManager({
      key: "demo",
      storage,
      fetcher: vi.fn().mockResolvedValue({ sample: 0.8 })
    });

    await expect(manager.getConfig()).resolves.toEqual({ sample: 0.8 });
  });

  it("Horn 插件启动后回写远端 sampling", async () => {
    const cfgManager = new CfgManager({ project: "demo", metric: { sample: 1 } });
    const plugin = createHornPlugin({
      fetcher: vi.fn().mockResolvedValue({ sampling: { metric: 0 } })
    });

    plugin.start({
      cfgManager,
      eventBus: new EventBus(),
      logger: new Logger(false),
      transport: { send: vi.fn() }
    });
    await vi.waitFor(() => {
      expect(cfgManager.getConfig("metric").sample).toBe(0);
    });
  });
});
