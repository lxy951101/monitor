import { describe, expect, it, vi } from "vitest";
import type { TransportRequest, TransportResponse } from "@monitor/transport";
import { ErrorManager } from "./index";

type SendFn = (request: TransportRequest) => Promise<TransportResponse | void>;

describe("ErrorManager", () => {
  it("解析 Error 并发送 c= 编码请求体", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new ErrorManager({
      project: "demo",
      pageUrl: "/home",
      send
    });

    manager.addError(new Error("boom"));
    await manager.flush();

    expect(send.mock.calls[0][0].body).toContain("c=");
    expect(decodeURIComponent(send.mock.calls[0][0].body)).toContain("boom");
  });

  it("支持字符串和普通对象，并把 project 拼到默认上报 URL", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new ErrorManager({
      project: "demo",
      pageUrl: "/home",
      reportBaseUrl: "",
      delay: 5000,
      send
    });

    manager.addError("plain failure");
    manager.addError({ reason: "rejected", code: 500 });
    await manager.flush();

    const request = send.mock.calls[0][0];
    expect(request.url).toContain("/api/log");
    expect(request.url).toContain("project=demo");
    expect(decodeURIComponent(request.body)).toContain("plain failure");
    expect(decodeURIComponent(request.body)).toContain("rejected");
  });

  it("按 ignoreList、beforeSend/filter、去重和容量限制过滤错误", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new ErrorManager({
      project: "demo",
      pageUrl: "/home",
      maxNum: 2,
      delay: 5000, // 启用 combo 模式，让错误在队列中累积
      ignoreList: ["ignore me", /skip regexp/, (content) => content.includes("skip fn")],
      beforeSend: (model) => (String(model.content).includes("blocked") ? false : model),
      filter: (model) => !String(model.content).includes("filtered"),
      send
    });

    manager.addError("ignore me");
    manager.addError("skip regexp");
    manager.addError("skip fn");
    manager.addError("first");
    manager.addError("first");
    manager.addError("blocked");
    manager.addError("filtered");
    manager.addError("second");
    manager.addError("third");
    await manager.flush();

    const payload = JSON.parse(decodeURIComponent(send.mock.calls[0][0].body).slice(2));
    expect(payload.map((item: { content: string }) => item.content)).toEqual(["first", "second"]);
  });

  it("限制单条内容长度并支持延迟自动 flush (对齐 owl.js: >= maxSize 丢弃)", async () => {
    vi.useFakeTimers();
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new ErrorManager({
      project: "demo",
      pageUrl: "/home",
      maxSize: 10,
      delay: 100,
      send
    });

    // "123456789" 9 字符 < 10，应该通过
    manager.addError("123456789");
    // "1234567890" 10 字符 >= 10，应被丢弃
    manager.addError("1234567890");
    await vi.advanceTimersByTimeAsync(100);

    expect(send).toHaveBeenCalledTimes(1);
    expect(decodeURIComponent(send.mock.calls[0][0].body)).toContain("123456789");
    expect(decodeURIComponent(send.mock.calls[0][0].body)).not.toContain("1234567890");
    vi.useRealTimers();
  });

  it("队列达到 maxNum 时立即发送而不是继续丢弃", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new ErrorManager({
      project: "demo",
      pageUrl: "/home",
      maxNum: 2,
      delay: 5000, // 启用 combo 模式
      send
    });

    manager.addError("first");
    manager.addError("second");

    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    expect(decodeURIComponent(send.mock.calls[0][0].body)).toContain("second");
  });

  it("自动 flush 失败不产生未处理 reject，且不重复写缓存", async () => {
    vi.useFakeTimers();
    const storage = createStorage();
    const send = vi.fn().mockRejectedValue(new Error("network"));
    const manager = new ErrorManager({
      project: "demo",
      pageUrl: "/home",
      delay: 10,
      storage,
      send
    });

    manager.addError("fail once");
    await vi.advanceTimersByTimeAsync(10);

    expect(send).toHaveBeenCalledTimes(1);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("发送失败期间新入队错误不会被缓存清理误删", async () => {
    let rejectSend: (error: Error) => void = () => undefined;
    const send = vi.fn<SendFn>(() => new Promise<TransportResponse | void>((_resolve, reject) => {
      rejectSend = reject;
    }));
    const storage = createStorage();
    const manager = new ErrorManager({ project: "demo", pageUrl: "/home", storage, delay: 5000, send });

    manager.addError("first");
    const flushing = manager.flush();
    manager.addError("second");
    rejectSend(new Error("network"));
    await expect(flushing).rejects.toThrow("network");

    send.mockReset();
    send.mockResolvedValue(undefined);
    await manager.flush();

    const body = String(send.mock.calls[0]![0].body);
    expect(decodeURIComponent(body)).toContain("second");
    expect(decodeURIComponent(body)).not.toContain("first");
  });

  it("缓存写入失败时保留失败 batch 在队列中", async () => {
    const send = vi.fn().mockRejectedValueOnce(new Error("network")).mockResolvedValue(undefined);
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error("blocked");
      }),
      removeItem: vi.fn()
    };
    const manager = new ErrorManager({ project: "demo", pageUrl: "/home", storage, delay: 5000, send });

    manager.addError("retry");
    await expect(manager.flush()).rejects.toThrow("network");
    await manager.flush();

    expect(send).toHaveBeenCalledTimes(2);
    expect(decodeURIComponent(send.mock.calls[1][0].body)).toContain("retry");
  });

  it("hook 抛错不会中断 addError，带全局标志正则仍稳定过滤", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new ErrorManager({
      project: "demo",
      pageUrl: "/home",
      ignoreList: [/skip/g, () => {
        throw new Error("hook");
      }],
      filter: () => {
        throw new Error("filter");
      },
      beforeSend: () => {
        throw new Error("before");
      },
      send
    });

    manager.addError("skip");
    manager.addError("skip");
    manager.addError("keep");
    await manager.flush();

    expect(send).toHaveBeenCalledTimes(1);
    expect(decodeURIComponent(send.mock.calls[0][0].body)).toContain("keep");
    expect(decodeURIComponent(send.mock.calls[0][0].body)).not.toContain("skip");
  });

  describe("parseWindowError (对齐 owl.js)", () => {
    it("从 Error.stack 中提取 resourceUrl 和行列号", async () => {
      const send = vi.fn().mockResolvedValue(undefined);
      const manager = new ErrorManager({ project: "demo", pageUrl: "/home", send });

      const err = new Error("parse fail");
      err.stack = "Error: parse fail\n    at Object.<anonymous> (https://cdn.example.com/app.js:42:15)";
      manager.parseWindowError("", "https://page.com/page", 10, 5, err);
      await manager.flush();

      expect(send).toHaveBeenCalledTimes(1);
      const body = decodeURIComponent(send.mock.calls[0][0].body);
      expect(body).toContain("parse fail");
      expect(body).toContain("app.js");
      expect(body).toContain("42");
      expect(body).toContain("15");
    });

    it("无 Error 对象时使用 msg 字符串", async () => {
      const send = vi.fn().mockResolvedValue(undefined);
      const manager = new ErrorManager({ project: "demo", pageUrl: "/home", send });

      manager.parseWindowError("raw error message", "https://page.com/app.js", 3, 8);
      await manager.flush();

      const body = decodeURIComponent(send.mock.calls[0][0].body);
      expect(body).toContain("raw error message");
    });
  });

  describe("parsePromiseUnhandled (对齐 owl.js)", () => {
    it("Error reason 时格式化为 [unhandledrejection] 前缀", async () => {
      const send = vi.fn().mockResolvedValue(undefined);
      const manager = new ErrorManager({ project: "demo", pageUrl: "/home", formatUnhandledRejection: true, send });

      manager.parsePromiseUnhandled({
        type: "unhandledrejection",
        reason: new Error("async boom")
      } as PromiseRejectionEvent);
      await manager.flush();

      const body = decodeURIComponent(send.mock.calls[0][0].body);
      expect(body).toContain("[unhandledrejection] async boom");
    });

    it("非 Error reason 时名称为 'unhandledrejection'", async () => {
      const send = vi.fn().mockResolvedValue(undefined);
      const manager = new ErrorManager({ project: "demo", pageUrl: "/home", send });

      manager.parsePromiseUnhandled({
        type: "unhandledrejection",
        reason: "plain reject"
      } as PromiseRejectionEvent);
      await manager.flush();

      const body = decodeURIComponent(send.mock.calls[0][0].body);
      expect(body).toContain("unhandledrejection");
    });
  });

  describe("parseConsoleError (对齐 owl.js)", () => {
    it("解析多种参数类型合并为一条错误", async () => {
      const send = vi.fn().mockResolvedValue(undefined);
      const manager = new ErrorManager({ project: "demo", pageUrl: "/home", send });

      manager.parseConsoleError("msg1", new Error("err2"), { key: "val" });
      await manager.flush();

      const body = decodeURIComponent(send.mock.calls[0][0].body);
      expect(body).toContain("consoleError");
      expect(body).toContain("msg1");
      expect(body).toContain("err2");
      expect(body).toContain("val");
    });
  });

  describe("noScriptError 过滤 (对齐 owl.js)", () => {
    it("过滤 sec_category 以 'Script error' 开头的错误", async () => {
      const send = vi.fn().mockResolvedValue(undefined);
      const manager = new ErrorManager({ project: "demo", pageUrl: "/home", noScriptError: true, send });

      // 使用 addError + options 模拟 "Script error" 错误
      manager.addError("Script error: permission denied", { sec_category: "Script error" });
      manager.addError("normal error", { sec_category: "normal" });
      await manager.flush();

      const body = decodeURIComponent(send.mock.calls[0][0].body);
      expect(body).toContain("normal");
      expect(body).not.toContain("Script error");
    });
  });

  describe("onErrorPush hook (对齐 owl.js)", () => {
    it("onErrorPush 可以转换或丢弃错误", async () => {
      const send = vi.fn().mockResolvedValue(undefined);
      const manager = new ErrorManager({
        project: "demo",
        pageUrl: "/home",
        delay: 5000,
        onErrorPush: (model) => {
          if (String(model.sec_category).includes("drop")) {
            return undefined; // 丢弃
          }
          return { ...model, sec_category: `[modified] ${model.sec_category}` };
        },
        send
      });

      manager.addError("drop this");
      manager.addError("keep this", { sec_category: "drop_me" });
      manager.addError("modify this", { sec_category: "original" });
      await manager.flush();

      const body = decodeURIComponent(send.mock.calls[0][0].body);
      expect(body).toContain("[modified] original");
      expect(body).not.toContain("drop_me");
    });
  });

  describe("限流 (对齐 owl.js time-window rate limiting)", () => {
    it("窗口内超过 maxNum 时丢弃后续错误", async () => {
      const send = vi.fn().mockResolvedValue(undefined);
      const manager = new ErrorManager({
        project: "demo",
        pageUrl: "/home",
        maxNum: 5,
        maxTime: 60000,
        delay: 5000, // 启用 combo 模式让错误累积
        send
      });

      // 第一批 5 条达到 maxNum，触发立即发送 (errorCount=5, 5-5=0 < 5 可过)
      manager.addError("a");
      manager.addError("b");
      manager.addError("c");
      manager.addError("d");
      manager.addError("e");
      await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));

      // 再入队 3 条，flush 时已发送数=5 >= maxNum=5 → 限流
      manager.addError("f");
      manager.addError("g");
      manager.addError("h");
      await manager.flush();

      // 第二次被限流
      expect(send).toHaveBeenCalledTimes(1);
    });

    it("窗口过期后重置限流计数器", async () => {
      vi.useFakeTimers();
      const send = vi.fn().mockResolvedValue(undefined);
      const manager = new ErrorManager({
        project: "demo",
        pageUrl: "/home",
        maxNum: 5,
        maxTime: 50,
        delay: 10,
        send
      });

      // 第一批
      manager.addError("a");
      manager.addError("b");
      await vi.advanceTimersByTimeAsync(10);
      expect(send).toHaveBeenCalledTimes(1);

      // 超出 maxTime 窗口
      await vi.advanceTimersByTimeAsync(60);

      // 新窗口内可继续发送
      manager.addError("c");
      await vi.advanceTimersByTimeAsync(10);
      expect(send).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });
  });

  describe("combo 延迟 (对齐 owl.js delay)", () => {
    it("多个错误在 delay 窗口内合并发送", async () => {
      vi.useFakeTimers();
      const send = vi.fn().mockResolvedValue(undefined);
      const manager = new ErrorManager({
        project: "demo",
        pageUrl: "/home",
        delay: 200,
        send
      });

      manager.addError("err1");
      manager.addError("err2");
      // 还未到 delay，不应发送
      expect(send).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(200);

      expect(send).toHaveBeenCalledTimes(1);
      const body = decodeURIComponent(send.mock.calls[0][0].body);
      expect(body).toContain("err1");
      expect(body).toContain("err2");
      vi.useRealTimers();
    });
  });

  describe("isExist 内容去重 (对齐 owl.js)", () => {
    it("相同 sec_category + resourceUrl + colNum + rowNum + content 只保留一条", async () => {
      const send = vi.fn().mockResolvedValue(undefined);
      const manager = new ErrorManager({
        project: "demo",
        pageUrl: "/home",
        dedupeTime: 100,
        send
      });

      manager.addError("same error");
      manager.addError("same error");
      await manager.flush();

      const payload = JSON.parse(decodeURIComponent(send.mock.calls[0][0].body).slice(2));
      expect(payload).toHaveLength(1);
    });
  });

  describe("owlErrDetected 事件 (对齐 owl.js)", () => {
    it("有效错误入队时广播 CustomEvent", async () => {
      const dispatchEvent = vi.fn();
      const originalWindow = globalThis.window;
      (globalThis as Record<string, unknown>).window = {
        dispatchEvent,
        CustomEvent: class extends Event {
          detail: unknown;
          constructor(type: string, init?: CustomEventInit) {
            super(type);
            this.detail = init?.detail;
          }
        }
      };
      const originalDocument = (globalThis as Record<string, unknown>).document;
      (globalThis as Record<string, unknown>).document = undefined;

      const send = vi.fn().mockResolvedValue(undefined);
      const manager = new ErrorManager({ project: "demo", pageUrl: "/home", send });

      try {
        manager.addError("test event");
        await manager.flush();

        expect(dispatchEvent).toHaveBeenCalledTimes(1);
        const event = dispatchEvent.mock.calls[0]![0] as CustomEvent;
        expect(event.type).toBe("owlErrDetected");
        expect(event.detail).toMatchObject({ project: "demo", category: "jsError" });
      } finally {
        (globalThis as Record<string, unknown>).window = originalWindow;
        (globalThis as Record<string, unknown>).document = originalDocument;
      }
    });
  });

  describe("reportSystemError (对齐 owl.js)", () => {
    it("SDK 自身错误通过 addError 管线自上报", async () => {
      const send = vi.fn().mockResolvedValue(undefined);
      const manager = new ErrorManager({ project: "demo", pageUrl: "/home", send });

      manager.reportSystemError(new Error("sdk internal error"));
      await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));

      const body = decodeURIComponent(send.mock.calls[0][0].body);
      expect(body).toContain("sdk internal error");
    });
  });

  describe("detectLeave (对齐 owl.js)", () => {
    it("注册 beforeunload 后页面离开时尝试 sendBeacon", () => {
      const sendBeacon = vi.fn().mockReturnValue(true);
      const originalWindow = globalThis.window;
      (globalThis as Record<string, unknown>).window = {
        onbeforeunload: null as unknown,
        navigator: { sendBeacon }
      } as unknown as Window & typeof globalThis;

      const manager = new ErrorManager({
        project: "demo",
        pageUrl: "/home",
        useSendBeacon: true,
        navigator: { sendBeacon },
        send: vi.fn()
      });

      try {
        manager.addError("before leave");
        manager.detectLeave();

        // 模拟 beforeunload
        const handler = (globalThis.window as unknown as { onbeforeunload: (() => void) | null }).onbeforeunload;
        expect(handler).not.toBeNull();
        handler?.();

        expect(sendBeacon).toHaveBeenCalledTimes(1);
        expect(sendBeacon.mock.calls[0]![0] as string).toContain("beacon=1");
      } finally {
        (globalThis as Record<string, unknown>).window = originalWindow;
      }
    });
  });
});

function createStorage() {
  const values = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key))
  };
}
