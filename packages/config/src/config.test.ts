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

  it("mergeMonitorConfig(base, {}) 返回值修改嵌套对象不会污染 base", () => {
    const base = createDefaultConfig();
    const merged = mergeMonitorConfig(base, {});

    merged.autoCatch.js = false;
    merged.page.points.push("custom");

    expect(base.autoCatch.js).toBe(true);
    expect(base.page.points).toEqual([]);
  });

  it("undefined 不覆盖已有值", () => {
    const config = mergeMonitorConfig(createDefaultConfig(), {
      project: undefined,
      page: { delay: undefined }
    });

    expect(config.project).toBe("");
    expect(config.page.delay).toBe(0);
  });

  it("数组覆盖且返回数组不共享 patch 数组引用", () => {
    const points = ["first"];
    const config = mergeMonitorConfig(createDefaultConfig(), {
      page: { points }
    });

    points.push("second");
    config.page.points.push("third");

    expect(config.page.points).toEqual(["first", "third"]);
    expect(points).toEqual(["first", "second"]);
  });

  it("函数覆盖行为正确", () => {
    const filter = (value: unknown) => Boolean(value);
    const config = mergeMonitorConfig(createDefaultConfig(), {
      filters: { custom: filter }
    });

    expect(config.filters.custom).toBe(filter);
    expect(config.filters.custom("ok")).toBe(true);
  });

  it("RegExp 覆盖行为正确", () => {
    const resourceReg = /\.mjs$/;
    const config = mergeMonitorConfig(createDefaultConfig(), {
      resource: { resourceReg }
    });

    expect(config.resource.resourceReg).toBe(resourceReg);
    expect(config.resource.resourceReg.test("entry.mjs")).toBe(true);
  });

  it("未 patch 的嵌套对象也不共享 base 引用", () => {
    const base = createDefaultConfig();
    const config = mergeMonitorConfig(base, { project: "demo" });

    expect(config.autoCatch).not.toBe(base.autoCatch);
    expect(config.perf.fsp2).not.toBe(base.perf.fsp2);

    config.perf.fsp2.customTags.env = "test";

    expect(base.perf.fsp2.customTags.env).toBeUndefined();
  });

  it("多次创建默认配置时 logan.cdnPrefixes 不共享可变数组引用", () => {
    const first = createDefaultConfig();
    const second = createDefaultConfig();

    (first.logan.cdnPrefixes as unknown as string[]).push("//example.com/logan_");

    expect(second.logan.cdnPrefixes).not.toContain("//example.com/logan_");
  });

  it("非法 resourceReg 字符串抛出 SyntaxError", () => {
    expect(() =>
      mergeMonitorConfig(createDefaultConfig(), {
        resource: { resourceReg: "[" }
      })
    ).toThrow(SyntaxError);
  });
});
