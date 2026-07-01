export interface Fsp2Point {
  x: number;
  y: number;
}

export interface Fsp2Cube {
  left: number;
  top: number;
  right: number;
  bottom: number;
  filled: boolean;
}

export interface Fsp2DetectorSnapshot {
  filledCount: number;
  fillRateDone: boolean;
  reachBottomDone: boolean;
  readyTime?: number;
  renderRate: number;
}

const X_CUBE_NUM = 3;
const Y_CUBE_NUM = 6;
const CUBE_COUNT = X_CUBE_NUM * Y_CUBE_NUM;
const FILL_CUBE_NUM = 17;
const BOTTOM_SIZE = 50;
const BOTTOM_POINT_NUM = 9;

export class Fsp2ViewportDetector {
  private readonly viewportWidth: number;
  private readonly viewportHeight: number;
  private readonly cubes: Fsp2Cube[];
  private fillRateDone = false;
  private reachBottomDone = false;
  private readyTime: number | undefined;

  constructor(viewportWidth: number, viewportHeight: number) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.cubes = createViewportCubes(viewportWidth, viewportHeight);
  }

  checkElements(elements: Element[], timestamp: number): boolean {
    for (const element of elements) {
      if (!this.fillRateDone) {
        const nextCount = this.checkFillRate(element);
        if (nextCount >= FILL_CUBE_NUM) {
          this.fillRateDone = true;
          this.readyTime = timestamp;
        }
      }

      if (!this.reachBottomDone && this.checkReachBottom(element)) {
        this.reachBottomDone = true;
        this.readyTime = timestamp;
      }

      if (this.isReady()) {
        return true;
      }
    }

    return false;
  }

  checkInitialPoints(isValidPoint: (point: Fsp2Point) => boolean, timestamp: number): boolean {
    let filledCount = 0;
    for (const cube of this.cubes) {
      const filled = getCubeInnerPoints(cube).some(isValidPoint);
      cube.filled = filled;
      if (filled) {
        filledCount += 1;
      }
    }

    // 对齐 owl: 初始检测使用 > 17 (即要求 18/18 全满)，比动态检测更严格
    // 因为 elementsFromPoint 点采样不如 getBoundingClientRect 相交检测精确
    if (filledCount > FILL_CUBE_NUM) {
      this.fillRateDone = true;
      this.readyTime = timestamp;
    }

    if (getViewportBottomPoints(this.viewportWidth, this.viewportHeight).some(isValidPoint)) {
      this.reachBottomDone = true;
      this.readyTime = timestamp;
    }

    return this.isReady();
  }

  // 对齐 owl: 不覆盖 readyTime，保留 fillRate/reachBottom 首次达标时间 (fillRateOrReachChangeTime)
  checkTimeoutElements(elements: Element[], timestamp: number): boolean {
    return this.checkElements(elements, timestamp);
  }

  forceReady(timestamp: number): void {
    this.fillRateDone = true;
    this.reachBottomDone = true;
    this.readyTime = timestamp;
  }

  markTimeout(timestamp: number): void {
    this.readyTime = timestamp;
  }

  isComplete(): boolean {
    return this.isReady();
  }

  completionTime(fallback: number): number {
    return this.readyTime ?? fallback;
  }

  checkPointElements(points: Fsp2Point[], elementFromPoint: (point: Fsp2Point) => Element | undefined): boolean {
    return points.some((point) => {
      const element = elementFromPoint(point);
      return Boolean(element);
    });
  }

  snapshot(): Fsp2DetectorSnapshot {
    const filledCount = this.filledCount();
    return {
      filledCount,
      fillRateDone: this.fillRateDone,
      reachBottomDone: this.reachBottomDone,
      readyTime: this.readyTime,
      renderRate: filledCount / CUBE_COUNT
    };
  }

  private checkFillRate(element: Element): number {
    const rect = normalizeRect(element.getBoundingClientRect());
    for (const cube of this.cubes) {
      if (!cube.filled && intersects(rect, cube)) {
        cube.filled = true;
      }
    }
    return this.filledCount();
  }

  private checkReachBottom(element: Element): boolean {
    const rect = normalizeRect(element.getBoundingClientRect());
    return rect.top <= this.viewportHeight && rect.bottom >= this.viewportHeight - BOTTOM_SIZE;
  }

  private filledCount(): number {
    return this.cubes.filter((cube) => cube.filled).length;
  }

  private isReady(): boolean {
    return this.fillRateDone && this.reachBottomDone;
  }
}

export function createViewportCubes(viewportWidth: number, viewportHeight: number): Fsp2Cube[] {
  const cubeWidth = viewportWidth / X_CUBE_NUM;
  const cubeHeight = viewportHeight / Y_CUBE_NUM;
  const cubes: Fsp2Cube[] = [];

  for (let xIndex = 0; xIndex < X_CUBE_NUM; xIndex += 1) {
    for (let yIndex = 0; yIndex < Y_CUBE_NUM; yIndex += 1) {
      cubes.push({
        left: xIndex * cubeWidth,
        top: yIndex * cubeHeight,
        right: (xIndex + 1) * cubeWidth,
        bottom: (yIndex + 1) * cubeHeight,
        filled: false
      });
    }
  }

  return cubes;
}

export function getViewportBottomPoints(viewportWidth: number, viewportHeight: number): Fsp2Point[] {
  const perWidth = viewportWidth / (BOTTOM_POINT_NUM + 1);
  const perHeight = BOTTOM_SIZE / (BOTTOM_POINT_NUM + 1);
  const upperHeight = viewportHeight - BOTTOM_SIZE;
  const points: Fsp2Point[] = [];

  for (let index = 0; index < BOTTOM_POINT_NUM; index += 1) {
    points.push({
      x: (index + 1) * perWidth,
      y: upperHeight + (index + 1) * perHeight
    });
  }

  return points;
}

export function getCubeInnerPoints(cube: Pick<Fsp2Cube, "left" | "top" | "right" | "bottom">): Fsp2Point[] {
  const cubeWidth = cube.right - cube.left;
  const cubeHeight = cube.bottom - cube.top;
  const xPointCount = 3;
  const yPointCount = 3;
  const unitWidth = cubeWidth / (xPointCount + 1);
  const unitHeight = cubeHeight / (yPointCount + 1);
  const points: Fsp2Point[] = [];

  for (let xIndex = 0; xIndex < xPointCount; xIndex += 1) {
    for (let yIndex = 0; yIndex < yPointCount; yIndex += 1) {
      points.push({
        x: cube.left + (xIndex + 1) * unitWidth,
        y: cube.top + (yIndex + 1) * unitHeight
      });
    }
  }

  return points;
}

function intersects(rect: Fsp2Cube, cube: Fsp2Cube): boolean {
  return rect.left < cube.right && rect.right > cube.left && rect.top < cube.bottom && rect.bottom > cube.top;
}

function normalizeRect(rect: DOMRect | ClientRect): Fsp2Cube {
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    filled: false
  };
}
