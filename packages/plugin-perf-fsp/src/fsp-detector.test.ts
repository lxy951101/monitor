import { describe, expect, it } from "vitest";
import {
  FspViewportDetector,
  createViewportCubes,
  getCubeInnerPoints,
  getViewportBottomPoints,
} from "./fsp-detector";

describe("秒开 2.0 视口检测", () => {
  it("将视口拆成 3x6 共 18 个宫格", () => {
    const cubes = createViewportCubes(300, 600);

    expect(cubes).toHaveLength(18);
    expect(cubes[0]).toEqual({
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      filled: false,
    });
    expect(cubes[17]).toEqual({
      left: 200,
      top: 500,
      right: 300,
      bottom: 600,
      filled: false,
    });
  });

  it("18 宫格填充达到 17 个并触底后才完成首屏", () => {
    const detector = new FspViewportDetector(300, 600);

    expect(detector.checkElements([rectElement(0, 0, 300, 549)], 120)).toBe(false);
    expect(detector.snapshot()).toMatchObject({
      filledCount: 18,
      fillRateDone: true,
      reachBottomDone: false,
    });

    expect(detector.checkElements([rectElement(0, 550, 300, 50)], 180)).toBe(true);
    expect(detector.snapshot()).toMatchObject({
      filledCount: 18,
      fillRateDone: true,
      reachBottomDone: true,
      readyTime: 180,
    });
  });

  it("元素只占 16 个宫格时不满足 90% 填充", () => {
    const detector = new FspViewportDetector(300, 600);

    expect(
      detector.checkElements([rectElement(0, 0, 200, 600), rectElement(200, 0, 100, 400)], 100),
    ).toBe(false);
    expect(detector.snapshot()).toMatchObject({
      filledCount: 16,
      fillRateDone: false,
    });
  });

  it("底部 50px 内的采样点用于判断静态页是否触底", () => {
    const points = getViewportBottomPoints(300, 600);

    expect(points).toHaveLength(9);
    expect(points[0]).toEqual({ x: 30, y: 555 });
    expect(points[8]).toEqual({ x: 270, y: 595 });
  });

  it("每个宫格内部按 3x3 点位做初始预检", () => {
    const points = getCubeInnerPoints({
      left: 0,
      top: 0,
      right: 120,
      bottom: 80,
    });

    expect(points).toHaveLength(9);
    expect(points[0]).toEqual({ x: 30, y: 20 });
    expect(points[8]).toEqual({ x: 90, y: 60 });
  });
});

function rectElement(left: number, top: number, width: number, height: number) {
  return {
    getBoundingClientRect: () => ({
      left,
      top,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      width,
      height,
    }),
  } as Element;
}
