import { describe, expect, it, vi } from "vitest";
import { CfgManager, EventBus, Logger } from "@monitor/core";
import { createPagePlugin } from "./index";

describe("createPagePlugin", () => {
  it("启动时按配置自动上报页面测速", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const plugin = createPagePlugin({
      pageUrl: "/home",
      env: {
        performance: {
          timing: { navigationStart: 100, fetchStart: 110, responseEnd: 180 }
        }
      }
    });

    plugin.start({
      cfgManager: new CfgManager({ project: "demo", reportBaseUrl: "" }),
      eventBus: new EventBus(),
      logger: new Logger(false),
      transport: { send }
    });
    await Promise.resolve();

    expect(send).toHaveBeenCalledTimes(1);
    expect(String(send.mock.calls[0][0].body)).toContain("demo|/home|/home");
  });

  it("autoCatch.page 关闭时不自动上报", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const plugin = createPagePlugin({
      env: {
        performance: {
          timing: { navigationStart: 100, fetchStart: 110 }
        }
      }
    });

    plugin.start({
      cfgManager: new CfgManager({ project: "demo", autoCatch: { page: false } }),
      eventBus: new EventBus(),
      logger: new Logger(false),
      transport: { send }
    });
    await Promise.resolve();

    expect(send).not.toHaveBeenCalled();
  });
});

