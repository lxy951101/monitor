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

  it("限制单条内容长度并支持延迟自动 flush", async () => {
    vi.useFakeTimers();
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new ErrorManager({
      project: "demo",
      pageUrl: "/home",
      maxSize: 5,
      maxTime: 100,
      send
    });

    manager.addError("123456789");
    await vi.advanceTimersByTimeAsync(100);

    expect(send).toHaveBeenCalledTimes(1);
    expect(decodeURIComponent(send.mock.calls[0][0].body)).toContain("12345");
    expect(decodeURIComponent(send.mock.calls[0][0].body)).not.toContain("123456");
    vi.useRealTimers();
  });

  it("队列达到 maxNum 时立即发送而不是继续丢弃", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new ErrorManager({
      project: "demo",
      pageUrl: "/home",
      maxNum: 2,
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
      maxTime: 10,
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
    const manager = new ErrorManager({ project: "demo", pageUrl: "/home", storage, send });

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
    const manager = new ErrorManager({ project: "demo", pageUrl: "/home", storage, send });

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
});

function createStorage() {
  const values = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key))
  };
}
