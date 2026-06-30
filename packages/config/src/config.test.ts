import { describe, expect, it } from "vitest";
import {
  API_PATHS,
  createDefaultConfig,
  getReportBaseUrl,
  mergeMonitorConfig
} from "./index";

describe("配置包", () => {
  it("默认使用生产上报域名", () => {
    expect(getReportBaseUrl(false)).toBe("https://catfront.dianping.com");
  });

  it("开发模式使用测试上报域名", () => {
    expect(getReportBaseUrl(true)).toBe("https://catfront.51ping.com");
  });

  it("深合并用户配置且保留 compat 默认值", () => {
    const config = mergeMonitorConfig(createDefaultConfig(), {
      project: "demo",
      compat: { legacyOwlAlias: true },
      page: { delay: 10 }
    });

    expect(config.project).toBe("demo");
    expect(config.compat.legacyOwlAlias).toBe(true);
    expect(config.page.delay).toBe(10);
    expect(config.autoCatch.js).toBe(true);
  });

  it("resourceReg 传字符串时能转成 RegExp", () => {
    const config = mergeMonitorConfig(createDefaultConfig(), {
      resource: { resourceReg: "\\.(js|css)$" }
    });

    expect(config.resource.resourceReg).toBeInstanceOf(RegExp);
    expect(config.resource.resourceReg.test("app.js")).toBe(true);
  });

  it("apiPaths 包含设计文档所有路径", () => {
    expect(API_PATHS).toEqual({
      log: "/api/log",
      logTs: "/api/logts",
      speedTs: "/api/speedts",
      pbBatchTs: "/pbbatchts",
      batchTs: "/batchts",
      metricJTs: "/rapi/metricjts",
      pvTs: "/api/pvts",
      fstSpeed: "/raptorapi/fstSpeed",
      fstLog: "/raptorapi/fstLog"
    });
  });

  it("默认配置包含所有配置模块", () => {
    const config = createDefaultConfig();

    expect(config).toEqual(
      expect.objectContaining({
        autoCatch: expect.any(Object),
        page: expect.any(Object),
        SPA: expect.any(Object),
        resource: expect.any(Object),
        ajax: expect.any(Object),
        image: expect.any(Object),
        error: expect.any(Object),
        metric: expect.any(Object),
        logan: expect.any(Object),
        perf: expect.any(Object),
        bridge: expect.any(Object),
        compat: expect.any(Object)
      })
    );
  });

  it("每次创建默认配置都返回新对象", () => {
    const first = createDefaultConfig();
    const second = createDefaultConfig();

    first.autoCatch.js = false;
    first.page.points.push("custom");

    expect(second.autoCatch.js).toBe(true);
    expect(second.page.points).not.toContain("custom");
  });
});
