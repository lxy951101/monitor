import { describe, expect, it, vi } from "vitest";
import { createBeaconTransport } from "./index";

describe("createBeaconTransport", () => {
  it("navigator.sendBeacon 存在且返回 true 时成功", async () => {
    const sendBeacon = vi.fn(() => true);
    const transport = createBeaconTransport({ navigator: { sendBeacon } });

    await expect(
      transport.send({ method: "POST", url: "/api", body: "payload" })
    ).resolves.toEqual({ ok: true, status: 0 });
    expect(sendBeacon).toHaveBeenCalledWith("/api", "payload");
  });

  it("调用 sendBeacon 时保持 navigator this 绑定", async () => {
    const navigatorLike = {
      sendBeacon(this: unknown) {
        return this === navigatorLike;
      }
    };
    const transport = createBeaconTransport({ navigator: navigatorLike });

    await expect(
      transport.send({ method: "POST", url: "/api", body: "payload" })
    ).resolves.toEqual({ ok: true, status: 0 });
  });

  it("navigator.sendBeacon 不存在时失败", async () => {
    const transport = createBeaconTransport({ navigator: {} });

    await expect(transport.send({ method: "POST", url: "/api" })).rejects.toThrow(
      "sendBeacon is not available"
    );
  });

  it("navigator.sendBeacon 返回 false 时失败", async () => {
    const transport = createBeaconTransport({
      navigator: { sendBeacon: vi.fn(() => false) }
    });

    await expect(transport.send({ method: "POST", url: "/api" })).rejects.toThrow(
      "sendBeacon returned false"
    );
  });
});
