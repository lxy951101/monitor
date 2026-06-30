import { describe, expect, it, vi } from "vitest";
import { PageManager } from "./index";

describe("PageManager", () => {
  it("上报 navigation timing 到 speedts", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new PageManager({ project: "demo", pageUrl: "/home", reportBaseUrl: "", send });

    await manager.reportNavigationTiming({
      navigationStart: 100,
      fetchStart: 110,
      responseEnd: 180
    });

    const request = send.mock.calls[0][0];
    expect(request.url).toContain("/api/speedts");
    expect(request.url).toContain("project=demo");
    expect(String(request.body)).toContain("demo|/home|/home");
    expect(String(request.body)).toContain("|10|");
  });

  it("上报首屏计算结果", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new PageManager({ project: "demo", pageUrl: "/home", reportBaseUrl: "", send });

    await manager.reportFirstScreen([{ tagName: "IMG", top: 0, height: 10, width: 10, loadTime: 30 }], 100);

    expect(String(send.mock.calls[0][0].body)).toContain("|30|100");
  });
});

