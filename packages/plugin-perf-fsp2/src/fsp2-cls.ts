import type { Fsp2ViewportDetector } from "./fsp2-detector";
import type { Fsp2Runtime } from "./fsp2-runtime";
import type { Fsp2Manager } from "./index";

export interface RectLike {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface ElementWithRect {
  element: Element;
  rect: RectLike;
}

export interface Fsp2ClsRuntimeState {
  runtime: Fsp2Runtime;
  detector?: Fsp2ViewportDetector;
  clsObserver?: InstanceType<NonNullable<Fsp2Runtime["MutationObserver"]>>;
  clsTimer?: ReturnType<typeof setInterval>;
  mutationCount: number;
  pageLoadedTime: number;
  costMs: number;
  cls: number;
  clsCycleCount: number;
  totalClsCycleCount: number;
  clsCycleStartTime: number;
  elementRects: Map<Element, RectLike>;
  clsObserverNodesRects: ElementWithRect[];
  allMovedNodesRects: RectLike[];
  now: () => number;
}

export function startClsStableCheck(
  manager: Fsp2Manager,
  state: Fsp2ClsRuntimeState,
  timestamp: number
): void {
  const runtime = state.runtime;
  if (!runtime.MutationObserver || !runtime.document?.body || !runtime.setInterval) {
    reportStableSuccess(manager, state, timestamp);
    return;
  }

  state.clsCycleStartTime = timestamp;
  state.clsObserver = new runtime.MutationObserver((records) => {
    collectClsRecords(records, state, runtime);
    if (state.clsObserverNodesRects.length === 0) {
      return;
    }
    const distance = compareNodePositionChange(state);
    calculateClsScore(state, runtime, distance);
    state.clsObserverNodesRects = [];
  });
  state.clsObserver.observe(runtime.document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true
  });
  state.clsTimer = runtime.setInterval(() => handleClsCycle(manager, state), 200);
}

function handleClsCycle(manager: Fsp2Manager, state: Fsp2ClsRuntimeState): void {
  state.clsCycleCount += 1;
  state.totalClsCycleCount += 1;
  if (state.cls >= 0.02) {
    resetClsCycle(state);
    return;
  }

  if (state.clsCycleCount >= 5) {
    const timestamp = state.clsCycleStartTime;
    resetClsCycle(state);
    stopClsStableCheck(state);
    reportStableSuccess(manager, state, timestamp);
    return;
  }
  state.cls = 0;
}

function resetClsCycle(state: Fsp2ClsRuntimeState): void {
  state.cls = 0;
  state.clsCycleCount = 0;
  state.clsCycleStartTime = state.now();
}

function reportStableSuccess(manager: Fsp2Manager, state: Fsp2ClsRuntimeState, timestamp: number): void {
  void manager.report({
    status: "success",
    timestamp,
    detector: state.detector?.snapshot(),
    mutationCount: state.mutationCount,
    cls: {
      pageLoadedTime: state.pageLoadedTime,
      pageStable: true,
      loadedStableGap: Math.max(0, timestamp - state.pageLoadedTime),
      calibrateEndType: "success",
      clsCycleLength: 200,
      clsCycleNum: state.totalClsCycleCount,
      clsCycleThreshold: 0.02
    },
    costMs: state.costMs
  });
}

export function stopClsStableCheck(state: Fsp2ClsRuntimeState): void {
  if (state.clsTimer && state.runtime.clearInterval) {
    state.runtime.clearInterval(state.clsTimer);
    state.clsTimer = undefined;
  }
  state.clsObserver?.disconnect();
  state.clsObserver = undefined;
}

function collectClsRecords(records: MutationRecord[], state: Fsp2ClsRuntimeState, runtime: Fsp2Runtime): void {
  for (const record of records) {
    if (record.type === "childList") {
      for (const node of Array.from(record.addedNodes ?? [])) {
        if (isElementNode(node)) {
          pushClsElement(state, runtime, node as Element);
        }
      }
      continue;
    }
    if (isElementNode(record.target)) {
      pushClsElement(state, runtime, record.target as Element);
      continue;
    }
    if (record.target.parentElement) {
      pushClsElement(state, runtime, record.target.parentElement);
    }
  }
}

function pushClsElement(state: Fsp2ClsRuntimeState, runtime: Fsp2Runtime, element: Element): void {
  const rect = toRectLike(element.getBoundingClientRect());
  if (isInViewport(runtime, rect)) {
    state.clsObserverNodesRects.push({ element, rect });
  }
}

function compareNodePositionChange(state: Fsp2ClsRuntimeState): number {
  let distance = 0;
  for (const elementWithRect of state.clsObserverNodesRects) {
    distance = Math.max(distance, clsNodePositionChange(state, elementWithRect));
  }
  return distance;
}

function clsNodePositionChange(state: Fsp2ClsRuntimeState, elementWithRect: ElementWithRect): number {
  const { element, rect } = elementWithRect;
  const lastRect = state.elementRects.get(element) ?? rect;
  let distance = 0;
  if (!rectsAreEqual(lastRect, rect, state.runtime)) {
    const width = viewportWidth(state.runtime);
    const height = viewportHeight(state.runtime);
    const horizontalMove = Math.abs(rect.left - lastRect.left);
    const verticalMove = Math.abs(rect.top - lastRect.top);
    distance = horizontalMove > verticalMove
      ? horizontalMove / width
      : verticalMove / height;
    state.allMovedNodesRects.push(rect);
  }
  state.elementRects.set(element, rect);
  return distance;
}

function calculateClsScore(state: Fsp2ClsRuntimeState, runtime: Fsp2Runtime, distance: number): void {
  if (state.allMovedNodesRects.length === 0 || distance <= 0) {
    state.allMovedNodesRects = [];
    return;
  }
  const rect = state.allMovedNodesRects.reduce((acc, item) => ({
    top: Math.min(acc.top, item.top),
    right: Math.max(acc.right, item.right),
    bottom: Math.max(acc.bottom, item.bottom),
    left: Math.min(acc.left, item.left)
  }), { top: Infinity, right: -Infinity, bottom: -Infinity, left: Infinity });
  const area = viewportIntersectionArea(runtime, rect);
  state.cls += (area / viewportArea(runtime)) * distance;
  state.allMovedNodesRects = [];
}

function viewportIntersectionArea(runtime: Fsp2Runtime, rect: RectLike): number {
  const intersection = {
    top: Math.max(rect.top, 0),
    right: Math.min(rect.right, viewportWidth(runtime)),
    bottom: Math.min(rect.bottom, viewportHeight(runtime)),
    left: Math.max(rect.left, 0)
  };
  if (intersection.right <= intersection.left || intersection.bottom <= intersection.top) {
    return 0;
  }
  return (intersection.right - intersection.left) * (intersection.bottom - intersection.top);
}

function isInViewport(runtime: Fsp2Runtime, rect: RectLike): boolean {
  return viewportIntersectionArea(runtime, rect) > 0;
}

function rectsAreEqual(left: RectLike, right: RectLike, runtime: Fsp2Runtime): boolean {
  return equalOrPastStart(left.left, right.left)
    && equalOrPastStart(left.top, right.top)
    && equalOrPastEnd(left.right, right.right, viewportWidth(runtime))
    && equalOrPastEnd(left.bottom, right.bottom, viewportHeight(runtime));
}

function equalOrPastStart(left: number, right: number): boolean {
  return left === right || (left <= 0 && right <= 0);
}

function equalOrPastEnd(left: number, right: number, viewportSize: number): boolean {
  return left === right || (left >= viewportSize && right >= viewportSize);
}

function viewportArea(runtime: Fsp2Runtime): number {
  return viewportWidth(runtime) * viewportHeight(runtime);
}

function viewportWidth(runtime: Fsp2Runtime): number {
  return Math.max(runtime.document?.documentElement?.clientWidth ?? 0, runtime.innerWidth ?? 0, 1);
}

function viewportHeight(runtime: Fsp2Runtime): number {
  return Math.max(runtime.document?.documentElement?.clientHeight ?? 0, runtime.innerHeight ?? 0, 1);
}

function toRectLike(rect: DOMRect | ClientRect): RectLike {
  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left
  };
}

function isElementNode(node: Node): boolean {
  return node.nodeType === 1;
}
