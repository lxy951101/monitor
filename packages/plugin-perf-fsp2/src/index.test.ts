import { describe, expect, it, vi } from "vitest";
import { CfgManager, EventBus, Logger } from "@monitor/core";
import { calculateFsp2, createFsp2Plugin, Fsp2Manager } from "./index";

describe("秒开 2.0", () => {
  it("计算成功、超时和隐藏状态", () => {
    expect(calculateFsp2({ startTime: 100, firstScreenTime: 260, now: 260, timeout: 500 })).toEqual({
      status: "success",
      duration: 160
    });
    expect(calculateFsp2({ startTime: 100, firstScreenTime: 900, now: 900, timeout: 500 }).status).toBe("timeout");
    expect(calculateFsp2({ startTime: 100, now: 220, timeout: 500, hidden: true })).toEqual({
      status: "hidden",
      duration: 120
    });
  });

  it("命中采样并经过 beforeSend 后上报", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new Fsp2Manager({
      send,
      endpoint: "/perf/fsp2",
      timeout: 1000,
      now: () => 100,
      random: () => 0.2,
      sample: 0.5,
      beforeSend: (metrics) => ({ ...metrics, page: "home" })
    });

    await manager.report(360);

    expect(send).toHaveBeenCalledTimes(1);
    expect(JSON.parse(send.mock.calls[0][0].body)).toEqual({
      category: "fsp2_web",
      env: {},
      logs: [{ status: "success", duration: 260, page: "home" }]
    });
  });

  it("未命中采样或 beforeSend 返回 false 时不发送", async () => {
    const send = vi.fn();
    await new Fsp2Manager({
      send,
      endpoint: "/perf/fsp2",
      sample: 0.1,
      random: () => 0.9
    }).report(100);

    await new Fsp2Manager({
      send,
      endpoint: "/perf/fsp2",
      beforeSend: () => false
    }).report(100);

    expect(send).not.toHaveBeenCalled();
  });

  it("页面隐藏后上报 hidden 状态", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new Fsp2Manager({
      send,
      endpoint: "/perf/fsp2",
      now: () => 100
    });

    manager.markHidden();
    await manager.report(200);

    expect(JSON.parse(send.mock.calls[0][0].body).logs[0].status).toBe("hidden");
  });

  it("插件启动后监听页面隐藏并在超时后自动上报", async () => {
    let listener: (() => void) | undefined;
    let timeoutCallback: (() => void) | undefined;
    let now = 100;
    const send = vi.fn().mockResolvedValue(undefined);
    const runtime = {
      document: { visibilityState: "visible" },
      addEventListener: vi.fn((_, handler) => {
        listener = handler;
      }),
      removeEventListener: vi.fn(),
      setTimeout: vi.fn((callback) => {
        timeoutCallback = callback;
        return 1 as unknown as ReturnType<typeof setTimeout>;
      }),
      clearTimeout: vi.fn()
    };
    const plugin = createFsp2Plugin({ runtime, now: () => now });

    plugin.start(createContext(send));
    runtime.document.visibilityState = "hidden";
    listener?.();
    now = 1100;
    timeoutCallback?.();

    await vi.waitFor(() => {
      expect(JSON.parse(send.mock.calls[0][0].body).logs[0].status).toBe("hidden");
    });
  });
});

function createContext(send: ReturnType<typeof vi.fn>) {
  return {
    cfgManager: new CfgManager({ project: "demo", perf: { fsp2: { endpoint: "/perf/fsp2", timeout: 1000 } } }),
    eventBus: new EventBus(),
    logger: new Logger(false),
    transport: { send }
  };
}
