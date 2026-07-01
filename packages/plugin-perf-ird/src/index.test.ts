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
      tags: { env: "test" },
    });

    manager.recordTouchEnd(100);
    await manager.recordNextFrame(148);

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: "/perf/ird",
        timeout: 3000,
      }),
    );
    expect(JSON.parse(send.mock.calls[0][0].body)).toEqual({
      category: "ird_web",
      env: { env: "test" },
      logs: [{ delay: 48, touchEnd: 100, nextFrame: 148 }],
    });
  });

  it("未命中采样时不发送", async () => {
    const send = vi.fn();
    const manager = new IrdManager({
      send,
      endpoint: "/perf/ird",
      sample: 0.1,
      random: () => 0.9,
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
        setTimeout: vi.fn(() => 2 as unknown as ReturnType<typeof setTimeout>),
        clearTimeout: vi.fn(),
        now: () => 100,
      },
    });

    plugin.start(createContext(send));
    listener?.();
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  });

  it("requestAnimationFrame 未响应时按 timeout 上报", async () => {
    let listener: (() => void) | undefined;
    let timeoutCallback: (() => void) | undefined;
    const send = vi.fn().mockResolvedValue(undefined);
    const plugin = createIrdPlugin({
      runtime: {
        addEventListener: vi.fn((_, handler) => {
          listener = handler;
        }),
        removeEventListener: vi.fn(),
        requestAnimationFrame: vi.fn(() => 1),
        cancelAnimationFrame: vi.fn(),
        setTimeout: vi.fn((callback) => {
          timeoutCallback = callback;
          return 2 as unknown as ReturnType<typeof setTimeout>;
        }),
        clearTimeout: vi.fn(),
        now: () => 100,
      },
    });

    plugin.start(createContext(send));
    listener?.();
    timeoutCallback?.();

    await vi.waitFor(() => {
      expect(JSON.parse(send.mock.calls[0][0].body).logs[0]).toEqual({
        delay: 3000,
        timeout: true,
      });
    });
  });

  it("容器桥可用时使用 ird.record 上报", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const record = vi.fn((_event: unknown, callbacks: { success: () => void }) => {
      callbacks.success();
    });
    const manager = new IrdManager({
      send,
      endpoint: "/perf/ird",
      containerBridge: { "ird.record": record },
      project: "demo",
      pagePath: "/home",
      sample: 1,
    });

    manager.recordTouchEnd(100);
    await manager.recordNextFrame(148);

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        pagePath: "/home",
        techStack: "container",
        value: 48,
        tags: expect.objectContaining({
          appId: "demo",
          gatherSource: "js",
          $sr: 1,
        }),
      }),
      expect.objectContaining({ success: expect.any(Function), fail: expect.any(Function) }),
    );
    expect(send).not.toHaveBeenCalled();
  });
});

function createContext(send: ReturnType<typeof vi.fn>) {
  return {
    cfgManager: new CfgManager({ project: "demo", perf: { ird: { endpoint: "/perf/ird" } } }),
    eventBus: new EventBus(),
    logger: new Logger(false),
    transport: { send: send as any },
  };
}
