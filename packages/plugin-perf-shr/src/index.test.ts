import { describe, expect, it, vi } from "vitest";
import { CfgManager, EventBus, Logger } from "@monitor/core";
import { calculateScrollMetrics, createShrPlugin, ShrManager } from "./index";

describe("滚动帧率", () => {
  it("按源码公式计算滚动时长、帧数和掉帧率", () => {
    const metrics = calculateScrollMetrics({
      startTime: 0,
      endTime: 100,
      frameTimes: [0, 16.7, 50.1, 66.8, 100.2],
    });

    expect(metrics.duration).toBe(100);
    expect(metrics.frames).toBe(5);
    expect(metrics.fps).toBe(50);
    expect(metrics.frameDropRate).toBeCloseTo(335);
    expect(metrics.costMs).toBe(0);
  });

  it("上报 shr_web 指标", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new ShrManager({
      send,
      endpoint: "/perf/shr",
      tags: { page: "home" },
    });

    await manager.report({ startTime: 0, endTime: 100, frameTimes: [0, 16.7, 50.1] });

    expect(send).toHaveBeenCalledTimes(1);
    expect(JSON.parse(send.mock.calls[0][0].body)).toEqual({
      category: "shr_web",
      env: { page: "home" },
      logs: [
        {
          duration: 100,
          frames: 3,
          fps: 30,
          frameDropRate: 168,
          costMs: 0,
        },
      ],
    });
  });

  it("插件启动后持续追踪滚动帧并在停止后上报", async () => {
    let listener: (() => void) | undefined;
    const rafCallbacks: Array<(time: number) => void> = [];
    let now = 0;
    const send = vi.fn().mockResolvedValue(undefined);
    const plugin = createShrPlugin({
      idleDelay: 150,
      runtime: {
        addEventListener: vi.fn((_, handler) => {
          listener = handler;
        }),
        removeEventListener: vi.fn(),
        requestAnimationFrame: vi.fn((callback) => {
          rafCallbacks.push(callback);
          return rafCallbacks.length;
        }),
        cancelAnimationFrame: vi.fn(),
        now: () => now,
      },
    });

    plugin.start(createContext(send));
    listener?.();
    now = 16.7;
    rafCallbacks.shift()?.(16.7);
    now = 50.1;
    rafCallbacks.shift()?.(50.1);
    now = 220;
    rafCallbacks.shift()?.(66.8);

    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  });

  it("容器桥可用时上报滚动开始和结束事件", async () => {
    let listener: (() => void) | undefined;
    const rafCallbacks: Array<(time: number) => void> = [];
    let now = 100;
    const send = vi.fn().mockResolvedValue(undefined);
    const bridge = vi.fn((_event: unknown, callbacks: { success: () => void }) => {
      callbacks.success();
    });
    const plugin = createShrPlugin({
      runtime: {
        addEventListener: vi.fn((_, handler) => {
          listener = handler;
        }),
        removeEventListener: vi.fn(),
        requestAnimationFrame: vi.fn((callback) => {
          rafCallbacks.push(callback);
          return rafCallbacks.length;
        }),
        cancelAnimationFrame: vi.fn(),
        now: () => now,
      },
      containerBridge: { "shr.sendScrollStateTime": bridge },
      metadata: { pagePath: "/home", project: "demo" },
    });

    plugin.start(createContext(send));
    listener?.();
    now = 260;
    rafCallbacks.shift()?.(116.7);

    await vi.waitFor(() => {
      expect(bridge).toHaveBeenCalledTimes(2);
    });
    expect(bridge.mock.calls[0][0]).toMatchObject({
      pagePath: "/home",
      scrollStartTime: 100,
      scrollEndTime: 0,
    });
    expect(bridge.mock.calls[1][0]).toMatchObject({
      pagePath: "/home",
      scrollStartTime: 100,
      scrollEndTime: 100,
    });
    expect(send).not.toHaveBeenCalled();
  });
});

function createContext(send: ReturnType<typeof vi.fn>) {
  return {
    cfgManager: new CfgManager({ project: "demo", perf: { shr: { endpoint: "/perf/shr" } } }),
    eventBus: new EventBus(),
    logger: new Logger(false),
    transport: { send: send as any },
  };
}
