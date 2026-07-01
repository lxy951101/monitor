import { describe, expect, it, vi } from "vitest";
import { PageManager } from "./index";

describe("PageManager", () => {
  it("上报 navigation timing 到 speedts", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const manager = new PageManager({ project: "demo", pageUrl: "/home", reportBaseUrl: "", send });

    await manager.reportNavigationTiming({
      navigationStart: 100,
      fetchStart: 110,
      responseEnd: 180,
    });

    const request = send.mock.calls[0][0];
    expect(request.method).toBe("GET");
    expect(request.url).toContain("/api/speedts");
    expect(request.url).toContain("project=demo");
    // customspeed 包含点位编码: encodePageSpeedFromTiming 的点位 5=10, 12=80
    expect(request.url).toContain("customspeed=");
  });
});
