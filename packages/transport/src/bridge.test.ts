import { describe, expect, it, vi } from "vitest";
import { createBridgeTransport } from "./index";

describe("createBridgeTransport", () => {
  it("KNB 使用注入对象且透传参数", async () => {
    const request = vi.fn((_params: unknown, callbacks: { success: () => void }) => {
      callbacks.success();
    });
    const transport = createBridgeTransport({ bridge: { request }, method: "request" });

    await expect(
      transport.send({ method: "POST", url: "/api", headers: { token: "t" }, body: "payload" })
    ).resolves.toEqual({ ok: true, status: 0 });
    expect(request).toHaveBeenCalledWith(
      {
        method: "POST",
        url: "/api",
        headers: { token: "t" },
        body: "payload"
      },
      expect.objectContaining({
        success: expect.any(Function),
        fail: expect.any(Function)
      })
    );
  });

  it("MSI fail 回调会让发送失败", async () => {
    const request = vi.fn((_params: unknown, callbacks: { fail: (reason: Error) => void }) => {
      callbacks.fail(new Error("bridge failed"));
    });
    const transport = createBridgeTransport({ bridge: { request }, method: "request" });

    await expect(transport.send({ method: "GET", url: "/api" })).rejects.toThrow(
      "bridge failed"
    );
  });

  it("bridge 或方法不存在时失败可观测", async () => {
    const transport = createBridgeTransport({ bridge: {}, method: "request" });

    await expect(transport.send({ method: "GET", url: "/api" })).rejects.toThrow(
      "Bridge method request is not available"
    );
  });
});
