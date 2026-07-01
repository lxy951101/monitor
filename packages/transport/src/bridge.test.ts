import { describe, expect, it, vi } from "vitest";
import { createBridgeTransport, createContainerBridgeReporter } from "./index";

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

describe("createContainerBridgeReporter", () => {
  it("按平台桥名上报 FSP2 事件", async () => {
    const ffpRecord = vi.fn((_event: unknown, callbacks: { success: (value: string) => void }) => {
      callbacks.success("ok");
    });
    const reporter = createContainerBridgeReporter({
      bridge: { "ffp.record": ffpRecord },
      preferMSI: false
    });

    await expect(reporter.reportFsp2({ eType: "success", createMs: 100 })).resolves.toEqual({
      ok: true,
      status: 0,
      body: "ok"
    });
    expect(ffpRecord).toHaveBeenCalledWith(
      { eType: "success", createMs: 100 },
      expect.objectContaining({
        success: expect.any(Function),
        fail: expect.any(Function)
      })
    );
  });

  it("MSI 环境使用 fspRecord", async () => {
    const fspRecord = vi.fn((_event: unknown, callbacks: { success: () => void }) => {
      callbacks.success();
    });
    const reporter = createContainerBridgeReporter({
      bridge: { fspRecord },
      preferMSI: true
    });

    await reporter.reportFsp2({ eType: "timeout", createMs: 120 });

    expect(fspRecord).toHaveBeenCalledTimes(1);
  });
});
