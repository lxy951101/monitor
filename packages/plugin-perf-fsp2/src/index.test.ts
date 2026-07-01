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

  it("DOM 变更同时满足填充率和触底后立即上报 success", async () => {
    let mutationCallback: ((records: MutationRecord[]) => void) | undefined;
    let now = 100;
    const send = vi.fn().mockResolvedValue(undefined);
    const element = createElement(0, 0, 300, 600, "IMG");
    const runtime = {
      document: {
        visibilityState: "visible",
        readyState: "loading",
        body: createElement(0, 0, 300, 600, "BODY"),
        documentElement: { clientWidth: 300, clientHeight: 600 },
        elementsFromPoint: vi.fn(() => [])
      },
      innerWidth: 300,
      innerHeight: 600,
      MutationObserver: class {
        constructor(callback: (records: MutationRecord[]) => void) {
          mutationCallback = callback;
        }

        observe = vi.fn();
        disconnect = vi.fn();
      },
      getComputedStyle: vi.fn(() => ({
        visibility: "visible",
        display: "block",
        opacity: "1",
        getPropertyValue: () => ""
      })),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      setTimeout: vi.fn(() => 1 as unknown as ReturnType<typeof setTimeout>),
      clearTimeout: vi.fn()
    };
    const plugin = createFsp2Plugin({ runtime, now: () => now });

    plugin.start(createContext(send));
    now = 220;
    mutationCallback?.([
      {
        type: "childList",
        target: runtime.document.body,
        addedNodes: [element]
      } as unknown as MutationRecord
    ]);

    await vi.waitFor(() => {
      expect(JSON.parse(send.mock.calls[0][0].body).logs[0]).toMatchObject({
        status: "success",
        duration: 120,
        renderRate: 1,
        reachBottom: "reached",
        mutationCount: 1
      });
    });
  });

  it("容器桥可用时使用 ffp.record 上报 FSP2 事件", async () => {
    let mutationCallback: ((records: MutationRecord[]) => void) | undefined;
    let now = 100;
    const send = vi.fn().mockResolvedValue(undefined);
    const ffpRecord = vi.fn((_event: unknown, callbacks: { success: () => void }) => {
      callbacks.success();
    });
    const element = createElement(0, 0, 300, 600, "IMG");
    const runtime = createDomRuntime({
      mutationCallback: (callback) => {
        mutationCallback = callback;
      }
    });
    const plugin = createFsp2Plugin({
      runtime,
      now: () => now,
      containerBridge: { "ffp.record": ffpRecord }
    });

    plugin.start(createContext(send));
    now = 260;
    mutationCallback?.([createChildListRecord(runtime.document.body, element)]);

    await vi.waitFor(() => {
      expect(ffpRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          eType: "success",
          createMs: 260,
          appId: "demo",
          reachBottom: "reached",
          renderRate: 1,
          mutationCount: 1
        }),
        expect.objectContaining({
          success: expect.any(Function),
          fail: expect.any(Function)
        })
      );
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("静态页初始预检通过宫格内点位和底部点位直接上报 success", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const element = createElement(0, 0, 300, 600, "IMG");
    const runtime = createDomRuntime({
      elementsFromPoint: () => [element]
    });
    const plugin = createFsp2Plugin({ runtime, now: () => 100 });

    plugin.start(createContext(send));

    await vi.waitFor(() => {
      expect(JSON.parse(send.mock.calls[0][0].body).logs[0]).toMatchObject({
        status: "success",
        duration: 0,
        renderRate: 1,
        reachBottom: "reached"
      });
    });
  });

  it("timeout 后重新扫描 body，满足首屏时仍上报 success", async () => {
    let timeoutCallback: (() => void) | undefined;
    let now = 100;
    const send = vi.fn().mockResolvedValue(undefined);
    const body = createElement(0, 0, 300, 600, "BODY", {
      children: [createElement(0, 0, 300, 600, "IMG")]
    });
    const runtime = createDomRuntime({
      body,
      setTimeout: (callback) => {
        timeoutCallback = callback;
        return 1 as unknown as ReturnType<typeof setTimeout>;
      }
    });
    const plugin = createFsp2Plugin({ runtime, now: () => now });

    plugin.start(createContext(send));
    now = 1100;
    timeoutCallback?.();

    await vi.waitFor(() => {
      expect(JSON.parse(send.mock.calls[0][0].body).logs[0].status).toBe("success");
    });
  });

  it("load 后用户交互会以 interact 结束检测", async () => {
    let loadCallback: (() => void) | undefined;
    let clickCallback: (() => void) | undefined;
    const send = vi.fn().mockResolvedValue(undefined);
    const runtime = createDomRuntime({
      readyState: "loading",
      windowAddEventListener: (type, callback) => {
        if (type === "load") {
          loadCallback = callback;
        }
      },
      documentAddEventListener: (type, callback) => {
        if (type === "click") {
          clickCallback = callback;
        }
      }
    });
    const plugin = createFsp2Plugin({ runtime, now: () => 180 });

    plugin.start(createContext(send));
    loadCallback?.();
    clickCallback?.();

    await vi.waitFor(() => {
      expect(JSON.parse(send.mock.calls[0][0].body).logs[0].status).toBe("interact");
    });
  });

  it("开启 useIgnore 后过滤带 perf_ignore 的节点", async () => {
    let mutationCallback: ((records: MutationRecord[]) => void) | undefined;
    let timeoutCallback: (() => void) | undefined;
    let now = 100;
    const send = vi.fn().mockResolvedValue(undefined);
    const ignoredElement = createElement(0, 0, 300, 600, "IMG", { perfIgnore: true });
    const runtime = createDomRuntime({
      mutationCallback: (callback) => {
        mutationCallback = callback;
      },
      setTimeout: (callback) => {
        timeoutCallback = callback;
        return 1 as unknown as ReturnType<typeof setTimeout>;
      }
    });
    const plugin = createFsp2Plugin({ runtime, now: () => now });

    plugin.start(createContext(send, { useIgnore: true }));
    now = 220;
    mutationCallback?.([createChildListRecord(runtime.document.body, ignoredElement)]);
    now = 1200;
    timeoutCallback?.();

    await vi.waitFor(() => {
      expect(JSON.parse(send.mock.calls[0][0].body).logs[0]).toMatchObject({
        status: "timeout",
        renderRate: 0,
        reachBottom: "notReached"
      });
    });
  });
});

function createContext(send: ReturnType<typeof vi.fn>, fsp2: Record<string, unknown> = {}) {
  return {
    cfgManager: new CfgManager({
      project: "demo",
      perf: { fsp2: { endpoint: "/perf/fsp2", timeout: 1000, ...fsp2 } }
    }),
    eventBus: new EventBus(),
    logger: new Logger(false),
    transport: { send }
  };
}

function createElement(
  left: number,
  top: number,
  width: number,
  height: number,
  nodeName = "DIV",
  options: { children?: Element[]; perfIgnore?: boolean; text?: string } = {}
) {
  const element = {
    nodeType: 1,
    nodeName,
    isConnected: true,
    children: options.children ?? [],
    childNodes: options.text ? [{ nodeType: 3, nodeValue: options.text }] : [],
    parentElement: undefined,
    hasAttribute: (name: string) => name === "perf_ignore" && Boolean(options.perfIgnore),
    getBoundingClientRect: () => ({
      left,
      top,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      width,
      height
    })
  };
  return element as unknown as Element;
}

function createDomRuntime(options: {
  body?: Element;
  readyState?: string;
  elementsFromPoint?: (x: number, y: number) => Element[];
  mutationCallback?: (callback: (records: MutationRecord[]) => void) => void;
  setTimeout?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  windowAddEventListener?: (type: string, callback: () => void) => void;
  documentAddEventListener?: (type: string, callback: () => void) => void;
} = {}) {
  const body = options.body ?? createElement(0, 0, 300, 600, "BODY");
  return {
    document: {
      visibilityState: "visible",
      readyState: options.readyState ?? "complete",
      body,
      documentElement: { clientWidth: 300, clientHeight: 600 },
      elementsFromPoint: vi.fn(options.elementsFromPoint ?? (() => [])),
      addEventListener: vi.fn((type, callback) => options.documentAddEventListener?.(type, callback)),
      removeEventListener: vi.fn()
    },
    innerWidth: 300,
    innerHeight: 600,
    MutationObserver: class {
      constructor(callback: (records: MutationRecord[]) => void) {
        options.mutationCallback?.(callback);
      }

      observe = vi.fn();
      disconnect = vi.fn();
    },
    getComputedStyle: vi.fn(() => ({
      visibility: "visible",
      display: "block",
      opacity: "1",
      getPropertyValue: () => ""
    })),
    addEventListener: vi.fn((type, callback) => options.windowAddEventListener?.(type, callback)),
    removeEventListener: vi.fn(),
    setTimeout: vi.fn(options.setTimeout ?? (() => 1 as unknown as ReturnType<typeof setTimeout>)),
    clearTimeout: vi.fn()
  };
}

function createChildListRecord(target: Element | undefined, element: Element) {
  return {
    type: "childList",
    target,
    addedNodes: [element]
  } as unknown as MutationRecord;
}
