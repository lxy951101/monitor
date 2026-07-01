import { describe, expect, it } from "vitest";
import { createCustomSpeedModel, createPageSpeedModel, encodeCustomSpeed, encodePageSpeed } from "./index";

describe("页面测速协议", () => {
  it("speed 使用竖线数组编码并保留基础 timing 位置", () => {
    const model = createPageSpeedModel({
      project: "demo",
      pageUrl: "/home",
      realUrl: "https://example.com/home",
      unloadEventStart: 5,
      domComplete: 12
    });
    const fields = encodePageSpeed(model).split("|");
    expect(fields[5]).toBe("5");
    expect(fields[12]).toBe("12");
  });

  it("customspeed 使用竖线数组编码", () => {
    const model = createCustomSpeedModel({
      project: "demo",
      pageUrl: "/home",
      realUrl: "https://example.com/home",
      points: [1, 2, 3]
    });
    expect(encodeCustomSpeed(model)).toContain("1|2|3");
  });
});
