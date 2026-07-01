import { describe, expect, it } from "vitest";
import { createPerfMetadata } from "./perf-metadata";

describe("createPerfMetadata", () => {
  it("生成通用性能元信息并允许显式覆盖", () => {
    const metadata = createPerfMetadata({
      project: "demo",
      version: "1.0.0",
      pagePath: "/configured",
      sdkVersion: "0.1.0",
      runtime: {
        location: { href: "https://example.com/home?tab=1", pathname: "/home" },
        navigator: { userAgent: "ua", onLine: false, connection: { effectiveType: "4g" } },
        screen: { width: 390, height: 844 },
        performance: { timeOrigin: 80, timing: { navigationStart: 70 } },
        document: { documentElement: { innerHTML: "<html></html>" } }
      }
    });

    expect(metadata).toMatchObject({
      project: "demo",
      version: "1.0.0",
      sdkVersion: "0.1.0",
      pagePath: "/configured",
      pageUrl: "https://example.com/home?tab=1",
      pageOriginUrl: "https://example.com/home?tab=1",
      ua: "ua",
      userAgent: "ua",
      screen: "390x844",
      runEnv: "browser",
      biz: "web",
      networkType: "4g",
      pageNavStart: 70,
      isOffline: true
    });
    expect(metadata.visitId).toBeTruthy();
  });

  it("容器环境只表达通用 container，不包含特定容器名", () => {
    const metadata = createPerfMetadata({
      project: "demo",
      runEnv: "container",
      containerVersion: "1.2.3",
      runtime: {
        location: { href: "https://example.com", pathname: "/" },
        navigator: { userAgent: "ua", onLine: true },
        screen: { width: 1, height: 2 },
        performance: {}
      }
    });

    expect(metadata).toMatchObject({
      runEnv: "container",
      biz: "container",
      containerVersion: "1.2.3",
      isOffline: false
    });
  });
});
