import { describe, expect, it, vi } from "vitest";
import { CfgManager, EventBus, Logger } from "@monitor/core";
import { calculateInteractionDelay, createIrdPlugin, IrdManager } from "./index";

describe("交互响应耗时", () => {
  it("计算 touchend 到下一帧的耗时", () => {
    expect(calculateInteractionDelay(100, 148)).toBe(48);
    expect(calculateInteractionDelay(200, 180)).toBe(0);
  });

  it("记录 touchend 后上报 ird_web 指标", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new IrdManager({
      send,
      endpoint: "/perf/ird",
      timeout: 3000,
      tags: { env: "test" }
    });

    manager.recordTouchEnd(100);
    await manager.recordNextFrame(148);

    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      method: "POST",
      url: "/perf/ird",
      timeout: 3000
    }));
    expect(JSON.parse(send.mock.calls[0][0].body)).toEqual({
      category: "ird_web",
      env: { env: "test" },
      logs: [{ delay: 48, touchEnd: 100, nextFrame: 148 }]
    });
  });

  it("未命中采样时不发送", async () => {
    const send = vi.fn();
    const manager = new IrdManager({
      send,
      endpoint: "/perf/ird",
      sample: 0.1,
      random: () => 0.9
    });

    manager.recordTouchEnd(100);
    await manager.recordNextFrame(148);

    expect(send).not.toHaveBeenCalled();
  });

  it("插件启动后监听 touchend 并在下一帧上报", async () => {
    let listener: (() => void) | undefined;
    const send = vi.fn().mockResolvedValue(undefined);
    const plugin = createIrdPlugin({
      runtime: {
        addEventListener: vi.fn((_, handler) => {
          listener = handler;
        }),
        removeEventListener: vi.fn(),
        requestAnimationFrame: vi.fn((callback) => {
          callback(150);
          return 1;
        }),
        now: () => 100
      }
    });

    plugin.start(createContext(send));
    listener?.();
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  });
});

function createContext(send: ReturnType<typeof vi.fn>) {
  return {
    cfgManager: new CfgManager({ project: "demo", perf: { ird: { endpoint: "/perf/ird" } } }),
    eventBus: new EventBus(),
    logger: new Logger(false),
    transport: { send }
  };
}
