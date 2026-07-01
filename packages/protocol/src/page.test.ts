import { describe, expect, it } from "vitest";
import {
 createCustomSpeedModel,
 createPageSpeedModel,
 encodeCustomSpeed,
 encodePageSpeed,
 PERF_INDEX
} from "./index";

describe("页面测速协议", () => {
 it("encodePageSpeed 点位索引 (perfMap)", () => {
  const model = createPageSpeedModel({
   navigationStart: 1000,
   unloadEventStart: 1005,
   domComplete: 1012,
   loadEventEnd: 1020,
  });
  const points = encodePageSpeed(model).split("|");

  // 点位 0 预留
  // 点位 1 = unloadEventStart (1005 - navStart 已在 model 中体现为相对值)
  // 这里 model 中的值就是绝对 timing，index 1 应为我们设置的值 1005
  expect(points.length).toBe(27);
  expect(Number(points[PERF_INDEX.unloadEventStart])).toBe(1005);
  expect(Number(points[PERF_INDEX.domComplete])).toBe(1012);
  expect(Number(points[PERF_INDEX.loadEventEnd])).toBe(1020);
 });

 it("encodePageSpeed 自动计算派生指标 (dns/tcp/download)", () => {
  const model = createPageSpeedModel({
   navigationStart: 0,
   domainLookupStart: 10,
   domainLookupEnd: 20,
   connectStart: 30,
   connectEnd: 50,
   requestStart: 60,
   responseEnd: 100,
  });
  const points = encodePageSpeed(model).split("|");
  expect(Number(points[20])).toBe(10); // dns = 20-10
  expect(Number(points[21])).toBe(20); // tcp = 50-30
  expect(Number(points[22])).toBe(40); // download = 100-60
 });

 it("encodePageSpeed 支持预计算值覆盖自动推导", () => {
  const model = createPageSpeedModel({
   navigationStart: 0,
   dns: 99,
   tcp: 88,
   download: 77,
  });
  const points = encodePageSpeed(model).split("|");
  expect(Number(points[20])).toBe(99);
  expect(Number(points[21])).toBe(88);
  expect(Number(points[22])).toBe(77);
 });

 it("encodePageSpeed 包含 Paint 和 FST/FCP 点位", () => {
  const model = createPageSpeedModel({
   navigationStart: 0,
   firstPaint: 100,
   firstContentfulPaint: 200,
   FST: 300,
   FCP: 250,
  });
  const points = encodePageSpeed(model).split("|");
  expect(Number(points[23])).toBe(100); // firstPaint
  expect(Number(points[24])).toBe(200); // firstContentfulPaint
  expect(Number(points[25])).toBe(300); // FST
  expect(Number(points[26])).toBe(250); // FCP
 });

 it("encodeCustomSpeed 仅输出 points.join('|')，customspeed", () => {
  const model = createCustomSpeedModel({
   points: [1, 2, 3],
  });
  expect(encodeCustomSpeed(model)).toBe("1|2|3");
 });
});
