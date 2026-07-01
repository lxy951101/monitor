import { describe, expect, it, vi } from "vitest";
import { CfgManager } from "./index";

describe("CfgManager", () => {
 it("读取和更新配置，并按 devMode 切换上报域名", () => {
  const cfg = new CfgManager({ project: "demo", devMode: false });

  expect(cfg.getConfig("reportBaseUrl")).toBe("https://report.example.com");

  cfg.updateConfig({ devMode: true, page: { delay: 20 } });

  expect(cfg.getConfig("reportBaseUrl")).toBe("https://report-dev.example.com");
  expect(cfg.getConfig("page").delay).toBe(20);
 });

 it("生成带 config、endpoints、protocol、webVersion 和首个 project st=1 的 API URL", () => {
  const cfg = new CfgManager({ project: "demo", webVersion: "1.2.3" });

  const first = cfg.getApiPath("log", { extra: "ok" });
  const second = cfg.getApiPath("log");

  expect(first).toContain("https://report.example.com/api/log?");
  expect(first).toContain("project=demo");
  expect(first).toContain("webVersion=1.2.3");
  expect(first).toContain("extra=ok");
  expect(first).toContain("st=1");
  expect(second).not.toContain("st=1");
 });

 it("支持采样 random 注入、扩展维度、过滤器管理和远端 sampling 回写", () => {
  const cfg = new CfgManager({ project: "demo", metric: { sample: 0.5 } }, { random: () => 0.4 });
  const filter = vi.fn(() => true);

  expect(cfg.isSampled("metric")).toBe(true);
  cfg.setRandom(() => 0.8);
  expect(cfg.isSampled("metric")).toBe(false);

  cfg.setExtension("city", "shanghai");
  cfg.setExtension("env", undefined);
  expect(cfg.getExtensions()).toEqual({ city: "shanghai" });

  cfg.addFilter("ignore", filter);
  expect(cfg.runFilter("ignore", "value")).toBe(true);
  cfg.removeFilter("ignore");
  expect(cfg.runFilter("ignore", "value")).toBe(true);

  cfg.applyRemoteSampling({ metric: 0.25, resource: 0 });
  expect(cfg.getConfig("metric").sample).toBe(0.25);
  expect(cfg.getConfig("resource").sample).toBe(0);
 });

 it("对外读取配置不暴露内部可变引用", () => {
  const cfg = new CfgManager({ project: "demo", metric: { sample: 0.5 } });
  const metric = cfg.getConfig("metric");
  metric.sample = 0;

  expect(cfg.getConfig("metric").sample).toBe(0.5);
 });

 it("updateConfig 和 setConfig 不返回内部可变引用", () => {
  const cfg = new CfgManager({ project: "demo", metric: { sample: 0.5 } });
  const updated = cfg.updateConfig({ metric: { sample: 0.4 } });
  updated.metric.sample = 0;

  const set = cfg.setConfig("metric", { ...cfg.getConfig("metric"), sample: 0.3 });
  set.metric.sample = 0;

  expect(cfg.getConfig("metric").sample).toBe(0.3);
 });

 it("updateConfig 支持用 undefined 删除扩展维度", () => {
  const cfg = new CfgManager({ project: "demo", extensions: { city: "shanghai" } });

  cfg.updateConfig({ extensions: { city: undefined, env: "test" } });

  expect(cfg.getExtensions()).toEqual({ env: "test" });
 });
});
