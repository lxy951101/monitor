import { describe, expect, it, vi } from "vitest";
import { createLoganScriptUrl, loadLoganScript, LoganManager } from "./index";

describe("LoganManager", () => {
  it("未 ready 前排队，ready 后 flush 到外部 Logan API", () => {
    const manager = new LoganManager();
    const api = { log: vi.fn() };

    manager.session({ id: "s1" });
    manager.ajax({ url: "/api" });
    manager.setReady(api);
    manager.error({ message: "boom" });

    expect(api.log).toHaveBeenCalledWith('{"id":"s1"}', "Session");
    expect(api.log).toHaveBeenCalledWith('{"url":"/api"}', "Ajax");
    expect(api.log).toHaveBeenCalledWith('{"message":"boom"}', "Error");
  });

  it("支持 CDN 地址配置和动态加载", async () => {
    let script: ReturnType<typeof createScript> | undefined;
    const document = {
      createElement: vi.fn(() => {
        script = createScript();
        return script;
      }),
      head: {
        appendChild: vi.fn(() => script?.onload?.())
      }
    };

    expect(createLoganScriptUrl("1.2.3", ["//cdn/logan_"])).toBe("//cdn/logan_1.2.3.js");
    await expect(loadLoganScript({ version: "1.2.3", cdnPrefixes: ["//cdn/logan_"], document })).resolves.toBeUndefined();
    expect(script?.src).toBe("//cdn/logan_1.2.3.js");
  });

  it("autoLoad 使用注入 loader，外部 ready 后发送 Performance/Resource 日志", async () => {
    const loadScript = vi.fn().mockResolvedValue(undefined);
    const api = { log: vi.fn() };
    const manager = new LoganManager({ autoLoad: true, loadScript });

    await manager.start();
    manager.performance({ fcp: 100 });
    manager.resource({ url: "/app.js" });
    manager.setReady(api);

    expect(loadScript).toHaveBeenCalledTimes(1);
    expect(api.log).toHaveBeenCalledWith('{"fcp":100}', "Performance");
    expect(api.log).toHaveBeenCalledWith('{"url":"/app.js"}', "Resource");
  });

  it("动态加载完成后读取全局 Logan API 并 flush 队列", async () => {
    const api = { log: vi.fn() };
    const manager = new LoganManager({
      autoLoad: true,
      loadScript: vi.fn().mockResolvedValue(undefined),
      getGlobalApi: () => api
    });

    manager.navigation({ path: "/home" });
    await manager.start();

    expect(api.log).toHaveBeenCalledWith('{"path":"/home"}', "Navigation");
  });
});

function createScript() {
  return {
    src: "",
    async: false,
    onload: null as (() => void) | null,
    onerror: null as ((error: unknown) => void) | null
  };
}
