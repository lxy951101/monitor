import { describe, expect, it, vi } from "vitest";
import { EventBus } from "./index";

describe("EventBus", () => {
  it("支持 on/off/emit，listener 异常不能阻止其他 listener", () => {
    const bus = new EventBus<{ ready: [string] }>();
    const broken = vi.fn(() => {
      throw new Error("boom");
    });
    const received = vi.fn();

    bus.on("ready", broken);
    bus.on("ready", received);
    bus.emit("ready", "ok");
    bus.off("ready", broken);
    bus.emit("ready", "again");

    expect(broken).toHaveBeenCalledTimes(1);
    expect(received).toHaveBeenCalledTimes(2);
    expect(received).toHaveBeenNthCalledWith(1, "ok");
    expect(received).toHaveBeenNthCalledWith(2, "again");
  });
});
