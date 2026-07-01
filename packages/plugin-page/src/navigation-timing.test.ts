import { describe, expect, it } from "vitest";
import { encodePageSpeedFromTiming, encodePaintTiming } from "./index";

describe("页面测速", () => {
 it("把 navigation timing 转成 speed 数组", () => {
  const speed = encodePageSpeedFromTiming({
   navigationStart: 100,
   fetchStart: 110,
   responseEnd: 180,
   domInteractive: 220,
   loadEventStart: 300,
   loadEventEnd: 320
  });

  expect(speed.split("|")[5]).toBe("10");
  expect(speed.split("|")[12]).toBe("80");
 });

 it("负数和 NaN 归零，并编码 paint timing", () => {
  const speed = encodePageSpeedFromTiming({
   navigationStart: 100,
   fetchStart: 90,
   responseEnd: Number.NaN
  });

  expect(speed.split("|")[5]).toBe("0");
  expect(speed.split("|")[12]).toBe("0");
  expect(encodePaintTiming([{ name: "first-contentful-paint", startTime: 123.4 }])).toBe("0|123");
 });
});

