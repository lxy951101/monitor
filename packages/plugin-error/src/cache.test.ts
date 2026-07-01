import { describe, expect, it, vi } from "vitest";
import { ErrorManager, clearErrorCache, readErrorCache, writeErrorCache } from "./index";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key))
  };
}

describe("错误缓存", () => {
  it("读写并清理 localStorage 缓存", () => {
    const storage = createStorage();

    writeErrorCache([{ body: "c=%5B%5D", url: "/api/log" }], { storage, key: "k" });

    expect(readErrorCache({ storage, key: "k" })).toEqual([{ body: "c=%5B%5D", url: "/api/log" }]);
    clearErrorCache({ storage, key: "k" });
    expect(readErrorCache({ storage, key: "k" })).toEqual([]);
  });

  it("flush 失败时写缓存，后续启动可发送并清理", async () => {
    const storage = createStorage();
    const failedSend = vi.fn().mockRejectedValue(new Error("network"));
    const manager = new ErrorManager({
      project: "demo",
      pageUrl: "/home",
      storage,
      delay: 5000,
      send: failedSend
    });

    manager.addError("boom");
    await expect(manager.flush()).rejects.toThrow("network");
    expect(readErrorCache({ storage })).toHaveLength(1);

    const send = vi.fn().mockResolvedValue(undefined);
    const nextManager = new ErrorManager({
      project: "demo",
      pageUrl: "/home",
      storage,
      send
    });

    await nextManager.sendCachedErrors();

    expect(send).toHaveBeenCalledTimes(1);
    expect(readErrorCache({ storage })).toEqual([]);
  });

  it("页面离开时优先使用 sendBeacon，禁用缓存时不写 storage", () => {
    const storage = createStorage();
    const sendBeacon = vi.fn().mockReturnValue(true);
    const manager = new ErrorManager({
      project: "demo",
      pageUrl: "/home",
      storage,
      disableCache: true,
      useSendBeacon: true,
      delay: 5000,
      navigator: { sendBeacon },
      send: vi.fn()
    });

    manager.addError("leave");
    manager.handlePageLeave();

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("sendCachedErrors 部分失败时只保留未发送缓存", async () => {
    const storage = createStorage();
    writeErrorCache(
      [
        { body: "first", url: "/api/log" },
        { body: "second", url: "/api/log" }
      ],
      { storage }
    );
    const send = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("fail"));
    const manager = new ErrorManager({ project: "demo", pageUrl: "/home", storage, send });

    await expect(manager.sendCachedErrors()).rejects.toThrow("fail");

    expect(readErrorCache({ storage })).toEqual([{ body: "second", url: "/api/log" }]);
  });

  it("页面离开 fallback 写缓存后不保留队列副本", async () => {
    const storage = createStorage();
    const manager = new ErrorManager({
      project: "demo",
      pageUrl: "/home",
      storage,
      useSendBeacon: true,
      delay: 5000,
      navigator: { sendBeacon: vi.fn().mockReturnValue(false) },
      send: vi.fn().mockResolvedValue(undefined)
    });

    manager.addError("leave");
    manager.handlePageLeave();
    await manager.flush();

    expect(readErrorCache({ storage })).toHaveLength(1);
  });

  it("默认 localStorage 访问抛错时不向外抛", () => {
    const onError = vi.fn();
    const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new Error("blocked");
      }
    });

    expect(readErrorCache({ onError })).toEqual([]);
    expect(() => writeErrorCache([{ body: "c=", url: "/api/log" }], { onError })).not.toThrow();
    expect(onError).toHaveBeenCalled();

    if (original) {
      Object.defineProperty(globalThis, "localStorage", original);
    } else {
      delete (globalThis as { localStorage?: unknown }).localStorage;
    }
  });
});
