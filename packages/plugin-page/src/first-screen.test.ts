import { describe, expect, it, vi } from "vitest";
import { calculateFirstScreen, calculateNodeWeight, fstPerfAnalysis, startFirstScreenObserver } from "./index";

describe("首屏计算", () => {
  it("按可视区域面积和文本计算权重", () => {
    expect(calculateNodeWeight({ tagName: "IMG", top: 10, height: 100, width: 100 }, 80)).toBe(7000);
    expect(calculateNodeWeight({ tagName: "DIV", top: 900, height: 100, width: 100 }, 800)).toBe(0);
  });

  it("计算首屏时间并分析慢访问", () => {
    const result = calculateFirstScreen(
      [
        { tagName: "IMG", top: 0, height: 100, width: 100, loadTime: 1200 },
        { tagName: "P", top: 20, height: 20, width: 100, textLength: 20, loadTime: 400 }
      ],
      800
    );
    const analysis = fstPerfAnalysis(result, 1000);

    expect(result.time).toBe(1200);
    expect(analysis.slow).toBe(true);
    expect(analysis.detail).toContain("IMG");
  });

  it("MutationObserver 只负责采集节点并回调首屏结果", () => {
    let callback: ((records: MutationRecord[]) => void) | undefined;
    const disconnect = vi.fn();
    class FakeMutationObserver {
      constructor(nextCallback: (records: MutationRecord[]) => void) {
        callback = nextCallback;
      }
      observe = vi.fn();
      disconnect = disconnect;
    }
    const onResult = vi.fn();
    const element = {
      tagName: "IMG",
      textContent: "",
      getBoundingClientRect: () => ({ top: 0, height: 10, width: 20 })
    };

    const stop = startFirstScreenObserver({
      env: {
        MutationObserver: FakeMutationObserver,
        document: { body: {} as Node },
        viewportHeight: 100,
        now: () => 88
      },
      onResult
    });
    callback?.([{ addedNodes: [element] as unknown as NodeList } as MutationRecord]);
    stop();

    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ time: 88, score: 200 }));
    expect(disconnect).toHaveBeenCalled();
  });
});
