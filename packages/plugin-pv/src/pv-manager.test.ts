import { describe, expect, it, vi } from "vitest";
import { CfgManager, EventBus, Logger } from "@monitor/core";
import { createPvPlugin, PvManager, reportPv } from "./index";

describe("PvManager", () => {
  it("发送 Monitor 命名下的 PV 参数", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new PvManager({ project: "demo", pageUrl: "/home", send });

    await manager.report({ ctags: { scene: "case" } });

    const url = send.mock.calls[0][0].url;
    expect(url).toContain("/api/pvts");
    expect(url).toContain("project=demo");
    expect(url).toContain("pageurl=%2Fhome");
    expect(url).toContain("ctags=");
    expect(decodeURIComponent(url)).toContain('"scene":"case"');
  });

  it("resetPv 更新后续 PV 的页面标识和自定义 tags", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new PvManager({
      project: "demo",
      pageUrl: "/first",
      pageId: "first",
      ctags: { source: "old" },
      send
    });

    manager.resetPv({ pageUrl: "/second", pageId: "second", ctags: { source: "new" } });
    await manager.report();

    const url = decodeURIComponent(send.mock.calls[0][0].url);
    expect(url).toContain("pageurl=/second");
    expect(url).toContain("pageId=second");
    expect(url).toContain('"source":"new"');
  });

  it("reportPv 使用传入 manager 发送一次 PV", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new PvManager({ project: "demo", pageUrl: "/home", send });

    await reportPv(manager, { pageId: "home" });

    expect(send).toHaveBeenCalledTimes(1);
    expect(decodeURIComponent(send.mock.calls[0][0].url)).toContain("pageId=home");
  });

  it("start 可自动发送 PV 且允许禁用", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const auto = new PvManager({ project: "demo", pageUrl: "/home", send, autoReport: true });
    const disabled = new PvManager({ project: "demo", pageUrl: "/home", send, autoReport: false });

    auto.start();
    disabled.start();
    await Promise.resolve();

    expect(send).toHaveBeenCalledTimes(1);
  });

  it("使用 cfgManager 的 endpoint 和配置", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const cfgManager = new CfgManager({
      project: "demo",
      reportBaseUrl: "https://example.test",
      endpoints: { pvTs: "/custom/pv" },
      extensions: { env: "test" }
    });
    const manager = new PvManager({ cfgManager, pageUrl: "/home", send });

    await manager.report();

    const url = send.mock.calls[0][0].url;
    expect(url).toContain("https://example.test/custom/pv");
    expect(url).toContain("env=test");
  });

  it("插件工厂启动时自动发送 PV，并尊重 autoCatch.pv 禁用", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const plugin = createPvPlugin({ pageUrl: "/home", spa: false });
    const cfgManager = new CfgManager({ project: "demo", autoCatch: { pv: false } });

    plugin.start({
      cfgManager,
      eventBus: new EventBus(),
      logger: new Logger(false),
      transport: { send }
    });
    await Promise.resolve();

    expect(send).not.toHaveBeenCalled();
  });
});
