import { describe, expect, it, vi } from "vitest";
import { CfgManager, EventBus, Logger } from "@monitor/core";
import { createFspPlugin } from "./index";

describe("秒开 2.0 容器桥补充字段", () => {
 it("CLS 成功事件携带周期细节字段", async () => {
  let mutationCallback: ((records: MutationRecord[]) => void) | undefined;
  let clsIntervalCallback: (() => void) | undefined;
  let now = 100;
  const send = vi.fn().mockResolvedValue(undefined);
  const ffpRecord = vi.fn((_event: unknown, callbacks: { success: () => void }) => {
   callbacks.success();
  });
  const element = createElement(0, 0, 300, 600, "IMG");
  const runtime = createDomRuntime({
   mutationCallback: (callback) => {
    mutationCallback = callback;
   },
   setInterval: (callback) => {
    clsIntervalCallback = callback;
    return 2 as unknown as ReturnType<typeof setInterval>;
   }
  });
  const plugin = createFspPlugin({
   runtime,
   now: () => now,
   containerBridge: { "ffp.record": ffpRecord }
  });

  plugin.start(createContext(send, { fspClsEnable: true }));
  now = 220;
  mutationCallback?.([createChildListRecord(runtime.document.body, element)]);
  now = 1220;
  for (let index = 0; index < 5; index += 1) {
   clsIntervalCallback?.();
  }

  await vi.waitFor(() => {
   expect(ffpRecord.mock.calls.at(-1)?.[0]).toMatchObject({
    eType: "success",
    calibrateEndType: "success",
    ffp_cls_cycle_length: 200,
    ffp_cls_cycle_num: 5,
    ffp_cls_cycle_threshold: 0.02
   });
  });
 });

 it("检测异常时上报 error 状态", async () => {
  let mutationCallback: ((records: MutationRecord[]) => void) | undefined;
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
  runtime.getComputedStyle.mockImplementation(() => {
   throw new Error("style failed");
  });
  const plugin = createFspPlugin({
   runtime,
   now: () => 220,
   containerBridge: { "ffp.record": ffpRecord }
  });

  plugin.start(createContext(send, { defer: false }));
  mutationCallback?.([createChildListRecord(runtime.document.body, element)]);

  await vi.waitFor(() => {
   expect(ffpRecord.mock.calls.at(-1)?.[0]).toMatchObject({ eType: "error" });
  });
 });
});

function createContext(send: ReturnType<typeof vi.fn>, fsp: Record<string, unknown> = {}) {
 return {
  cfgManager: new CfgManager({
   project: "demo",
   perf: { fsp: { endpoint: "/perf/fsp", timeout: 1000, defer: false, fspClsEnable: false, ...fsp } }
  }),
  eventBus: new EventBus(),
  logger: new Logger(false),
  transport: { send }
 };
}

function createElement(left: number, top: number, width: number, height: number, nodeName = "DIV") {
 return {
  nodeType: 1,
  nodeName,
  isConnected: true,
  children: [],
  childNodes: [],
  parentElement: undefined,
  hasAttribute: () => false,
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
 } as unknown as Element;
}

function createDomRuntime(options: {
 mutationCallback?: (callback: (records: MutationRecord[]) => void) => void;
 setInterval?: (callback: () => void, delay: number) => ReturnType<typeof setInterval>;
} = {}) {
 const body = createElement(0, 0, 300, 600, "BODY");
 return {
  document: {
   visibilityState: "visible",
   readyState: "complete",
   body,
   documentElement: { clientWidth: 300, clientHeight: 600 },
   elementsFromPoint: vi.fn(() => []),
   addEventListener: vi.fn(),
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
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  setTimeout: vi.fn(() => 1 as unknown as ReturnType<typeof setTimeout>),
  clearTimeout: vi.fn(),
  setInterval: vi.fn(options.setInterval ?? (() => 2 as unknown as ReturnType<typeof setInterval>)),
  clearInterval: vi.fn()
 };
}

function createChildListRecord(target: Element | undefined, element: Element) {
 return {
  type: "childList",
  target,
  addedNodes: [element]
 } as unknown as MutationRecord;
}
