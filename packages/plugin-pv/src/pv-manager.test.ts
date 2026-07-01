import { describe, expect, it, vi } from "vitest";
import type { TransportResponse } from "@monitor/transport";
import { CfgManager, EventBus, Logger } from "@monitor/core";
import { createPvPlugin, PvManager, reportPv } from "./index";

describe("PvManager", () => {
  it("发送 POST 请求，PV 数据在 body 中", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new PvManager({ project: "demo", pageUrl: "/home", send });

    await manager.report({ ctags: { scene: "case" } });

    const request = send.mock.calls[0][0];
    // 请求方法
    expect(request.method).toBe("POST");
    expect(request.headers).toEqual({ "Content-Type": "application/x-www-form-urlencoded" });
    // URL 仅包含基础路径和公共参数（project, extensions 等）
    expect(request.url).toContain("/api/pvts");
    expect(request.url).toContain("project=demo");
    // PV 业务数据在 body 中
    const body = request.body as string;
    expect(body).toContain("pageurl=%2Fhome");
    expect(body).toContain("ctags=");
    expect(decodeURIComponent(body)).toContain('"scene":"case"');
  });

  it("resetPv 更新后续 PV 的页面标识和自定义 tags", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new PvManager({
      project: "demo",
      pageUrl: "/first",
      pageId: "first",
      ctags: { source: "old" },
      send,
    });

    manager.resetPv({ pageUrl: "/second", pageId: "second", ctags: { source: "new" } });
    await manager.report();

    const body = decodeURIComponent(send.mock.calls[0][0].body as string);
    expect(body).toContain("pageurl=/second");
    expect(body).toContain("pageId=second");
    expect(body).toContain('"source":"new"');
  });

  it("reportPv 使用传入 manager 发送一次 PV", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new PvManager({ project: "demo", pageUrl: "/home", send });

    await reportPv(manager, { pageId: "home" });

    expect(send).toHaveBeenCalledTimes(1);
    expect(decodeURIComponent(send.mock.calls[0][0].body as string)).toContain("pageId=home");
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

  it("使用 cfgManager 的 endpoint 和配置（URL 携带公共参数，body 携带 PV 数据）", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const cfgManager = new CfgManager({
      project: "demo",
      reportBaseUrl: "https://example.test",
      endpoints: { pvTs: "/custom/pv" },
      extensions: { env: "test" },
    });
    const manager = new PvManager({ cfgManager, pageUrl: "/home", send });

    await manager.report();

    const request = send.mock.calls[0][0];
    // URL 包含 endpoint 和公共参数（extensions）
    expect(request.url).toContain("https://example.test/custom/pv");
    expect(request.url).toContain("env=test");
    // PV 业务数据在 body
    expect(request.body).toContain("pageurl=%2Fhome");
  });

  it("插件工厂启动时自动发送 PV，并尊重 autoCatch.pv 禁用", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const plugin = createPvPlugin({ pageUrl: "/home", spa: false });
    const cfgManager = new CfgManager({ project: "demo", autoCatch: { pv: false } });

    plugin.start({
      cfgManager,
      eventBus: new EventBus(),
      logger: new Logger(false),
      transport: { send },
    });
    await Promise.resolve();

    expect(send).not.toHaveBeenCalled();
  });

  it("delay 选项下，快速连续调用只上报最后一次", async () => {
    vi.useFakeTimers();
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new PvManager({ project: "demo", pageUrl: "/home", send });

    void manager.report({ delay: true, pageUrl: "/first" });
    void manager.report({ delay: true, pageUrl: "/second" });
    const lastPromise = manager.report({ delay: true, pageUrl: "/third" });

    await vi.advanceTimersByTimeAsync(100);
    expect(send).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(150);
    await lastPromise;
    expect(send).toHaveBeenCalledTimes(1);
    expect(decodeURIComponent(send.mock.calls[0][0].body as string)).toContain("pageurl=/third");

    vi.useRealTimers();
  });

  it("delay 和非 delay 混合调用时，非 delay 立即发送", async () => {
    vi.useFakeTimers();
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new PvManager({ project: "demo", pageUrl: "/home", send });

    void manager.report({ delay: true, pageUrl: "/delayed" });
    await manager.report({ pageUrl: "/immediate" });

    expect(send).toHaveBeenCalledTimes(1);
    expect(decodeURIComponent(send.mock.calls[0][0].body as string)).toContain(
      "pageurl=/immediate",
    );

    await vi.advanceTimersByTimeAsync(250);
    expect(send).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it("stop 时清除 delay timer，不再上报", () => {
    vi.useFakeTimers();
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new PvManager({ project: "demo", pageUrl: "/home", send });

    void manager.report({ delay: true, pageUrl: "/will-be-cancelled" });
    manager.stop();
    vi.advanceTimersByTime(250);

    expect(send).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("PV 上报成功后调用 onResponse", async () => {
    const response: TransportResponse = { ok: true, status: 200 };
    const send = vi.fn().mockResolvedValue(response);
    const onResponse = vi.fn();
    const cfgManager = new CfgManager({ project: "demo" });
    const manager = new PvManager({ cfgManager, pageUrl: "/home", send, onResponse });

    await manager.report();

    expect(onResponse).toHaveBeenCalledTimes(1);
    expect(onResponse).toHaveBeenCalledWith(response, cfgManager);
  });

  it("send 返回 void 时不调用 onResponse", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const onResponse = vi.fn();
    const manager = new PvManager({ project: "demo", pageUrl: "/home", send, onResponse });

    await manager.report();

    expect(onResponse).not.toHaveBeenCalled();
  });
});
