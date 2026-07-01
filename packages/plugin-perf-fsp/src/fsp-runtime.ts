import { FspViewportDetector } from "./fsp-detector";
import { startClsStableCheck, stopClsStableCheck, type FspClsRuntimeState } from "./fsp-cls";
import type { FspClsMetrics, FspManager } from "./index";

export interface FspRuntime {
  document?: FspRuntimeDocument;
  innerWidth?: number;
  innerHeight?: number;
  location?: Pick<Location, "href" | "pathname">;
  navigator?: Pick<Navigator, "userAgent" | "onLine">;
  performance?: Partial<Pick<Performance, "timeOrigin">> & {
    timing?: Partial<Pick<PerformanceTiming, "navigationStart">>;
  };
  containerBridge?: Record<string, unknown>;
  MutationObserver?: new (callback: (records: MutationRecord[]) => void) => {
    observe: (target: Node, options: MutationObserverInit) => void;
    disconnect: () => void;
  };
  getComputedStyle?: (
    element: Element,
  ) => Pick<CSSStyleDeclaration, "visibility" | "display" | "opacity" | "getPropertyValue">;
  addEventListener: (type: "visibilitychange" | "load", listener: () => void) => void;
  removeEventListener: (type: "visibilitychange" | "load", listener: () => void) => void;
  setTimeout: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  clearTimeout: (timer: ReturnType<typeof setTimeout>) => void;
  setInterval?: (callback: () => void, delay: number) => ReturnType<typeof setInterval>;
  clearInterval?: (timer: ReturnType<typeof setInterval>) => void;
}

export interface FspRuntimeDocument {
  visibilityState?: string;
  readyState?: string;
  body?: Element;
  documentElement?: { clientWidth?: number; clientHeight?: number };
  elementsFromPoint?: (x: number, y: number) => Element[];
  addEventListener?: (type: "click" | "wheel" | "touchmove", listener: () => void) => void;
  removeEventListener?: (type: "click" | "wheel" | "touchmove", listener: () => void) => void;
}

export interface FspWatchOptions {
  timeout: number;
  useIgnore: boolean;
  fspClsEnable: boolean;
  defer: boolean;
  runtime?: FspRuntime;
  now?: () => number;
}

interface FspWatchState extends FspClsRuntimeState {
  runtime: FspRuntime;
  detector?: FspViewportDetector;
  observer?: InstanceType<NonNullable<FspRuntime["MutationObserver"]>>;
  timer?: ReturnType<typeof setTimeout>;
  mutationCount: number;
  originMutationCount: number;
  fspMutationTimestamp: number;
  pageLoadedTime: number;
  costMs: number;
  useIgnore: boolean;
  fspClsEnable: boolean;
  now: () => number;
  onVisibilityChange?: () => void;
  onInteract?: () => void;
  elementValidationMap: Map<Element, boolean>;
}

export function watchFspRuntime(
  manager: FspManager,
  options: FspWatchOptions,
): (() => void) | undefined {
  const runtime = options.runtime ?? getRuntime();
  if (!runtime) {
    return undefined;
  }

  const state = createWatchState(runtime, options);
  const stop = () => stopWatch(runtime, state);
  state.onVisibilityChange = () => handleVisibilityChange(manager, runtime, state, stop);
  state.onInteract = () => finishByInteract(manager, state, stop);
  runtime.addEventListener("visibilitychange", state.onVisibilityChange);
  void manager.reportLifecycle("start", state.now());

  if (runtime.document?.body && !supportFsp(runtime, state)) {
    void manager.reportLifecycle("notsupport", state.now(), state.costMs);
    stop();
    return stop;
  }

  const start = () => startFspCheck(manager, runtime, state, stop);
  // defer=false 时也需要 body 存在才能同步执行
  if (options.defer || !runtime.document?.body) {
    state.timer = runtime.setTimeout(start, 0);
  } else {
    start();
  }
  return stop;
}

function getRuntime(): FspRuntime | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return {
    document,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    location: window.location,
    navigator: window.navigator,
    performance: window.performance,
    containerBridge: getGlobalContainerBridge(),
    MutationObserver: window.MutationObserver,
    getComputedStyle: window.getComputedStyle.bind(window),
    addEventListener: window.addEventListener.bind(window),
    removeEventListener: window.removeEventListener.bind(window),
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  };
}

function getGlobalContainerBridge(): Record<string, unknown> | undefined {
  const scope = window as unknown as Record<string, unknown>;
  for (const key of ["containerBridge", "nativeBridge", "NativeBridge", "bridge"]) {
    const bridge = scope[key];
    if (bridge && typeof bridge === "object") {
      return bridge as Record<string, unknown>;
    }
  }
  return undefined;
}

function createWatchState(runtime: FspRuntime, options: FspWatchOptions): FspWatchState {
  const now = options.now ?? Date.now;
  return {
    runtime,
    detector: createRuntimeDetector(runtime),
    mutationCount: 0,
    originMutationCount: 0,
    fspMutationTimestamp: now(),
    pageLoadedTime: 0,
    costMs: 0,
    cls: 0,
    clsCycleCount: 0,
    totalClsCycleCount: 0,
    clsCycleStartTime: 0,
    elementRects: new Map(),
    clsObserverNodesRects: [],
    allMovedNodesRects: [],
    useIgnore: options.useIgnore,
    fspClsEnable: options.fspClsEnable,
    now,
    elementValidationMap: new Map(),
  };
}

function supportFsp(runtime: FspRuntime, state: FspWatchState): boolean {
  return Boolean(state.detector && runtime.document?.elementsFromPoint && runtime.MutationObserver);
}

function startFspCheck(
  manager: FspManager,
  runtime: FspRuntime,
  state: FspWatchState,
  stop: () => void,
): void {
  try {
    state.timer = resetTimer(manager, runtime, state, stop);
    if (state.detector && runtime.document?.body && runtime.MutationObserver) {
      if (checkInitialScreen(runtime, state)) {
        finishSuccess(manager, state, stop, state.now());
        return;
      }
      state.observer = createMutationObserver(
        runtime.MutationObserver,
        manager,
        runtime,
        state,
        stop,
      );
      state.observer.observe(runtime.document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      startInteractionListener(runtime, state);
    }
  } catch {
    finishByError(manager, state, stop);
  }
}

function createRuntimeDetector(runtime: FspRuntime): FspViewportDetector | undefined {
  const viewportWidth = Math.max(
    runtime.document?.documentElement?.clientWidth ?? 0,
    runtime.innerWidth ?? 0,
  );
  const viewportHeight = Math.max(
    runtime.document?.documentElement?.clientHeight ?? 0,
    runtime.innerHeight ?? 0,
  );
  if (!viewportWidth || !viewportHeight) {
    return undefined;
  }
  return new FspViewportDetector(viewportWidth, viewportHeight);
}

function createMutationObserver(
  Observer: NonNullable<FspRuntime["MutationObserver"]>,
  manager: FspManager,
  runtime: FspRuntime,
  state: FspWatchState,
  stop: () => void,
) {
  return new Observer((records) => {
    try {
      const timestamp = state.now();
      state.originMutationCount += 1;
      const elements = measureCost(state, () =>
        collectMutationElements(records, runtime, state.useIgnore, state.elementValidationMap),
      );
      if (elements.length === 0 || !state.detector) {
        return;
      }

      state.fspMutationTimestamp = timestamp;
      state.mutationCount += 1;
      if (measureCost(state, () => state.detector?.checkElements(elements, timestamp))) {
        finishSuccess(manager, state, stop, timestamp);
        return;
      }
      state.timer = resetTimer(manager, runtime, state, stop);
    } catch {
      finishByError(manager, state, stop);
    }
  });
}

function resetTimer(
  manager: FspManager,
  runtime: FspRuntime,
  state: FspWatchState,
  stop: () => void,
): ReturnType<typeof setTimeout> | undefined {
  if (state.originMutationCount >= 10) {
    return state.timer;
  }
  if (state.timer) {
    runtime.clearTimeout(state.timer);
  }
  return runtime.setTimeout(() => finishByTimeout(manager, runtime, state, stop), 5000);
}

function checkInitialScreen(runtime: FspRuntime, state: FspWatchState): boolean {
  const doc = runtime.document;
  if (!state.detector || !doc?.elementsFromPoint) {
    return false;
  }

  return (
    measureCost(state, () =>
      state.detector?.checkInitialPoints((point) => {
        const elements = doc.elementsFromPoint?.(point.x, point.y) ?? [];
        return elements.some((element) =>
          isValidElement(element, runtime, state.useIgnore, state.elementValidationMap),
        );
      }, state.now()),
    ) ?? false
  );
}

function finishSuccess(
  manager: FspManager,
  state: FspWatchState,
  stop: () => void,
  timestamp: number,
): void {
  if (!state.detector) {
    return;
  }
  state.pageLoadedTime = state.detector.completionTime(timestamp);
  stop();
  if (state.fspClsEnable) {
    startClsStableCheck(manager, state, timestamp);
    return;
  }
  void manager.report({
    status: "success",
    timestamp,
    detector: state.detector.snapshot(),
    mutationCount: state.mutationCount,
    cls: createClsMetrics(state, timestamp),
    costMs: state.costMs,
  });
}

function finishByTimeout(
  manager: FspManager,
  runtime: FspRuntime,
  state: FspWatchState,
  stop: () => void,
): void {
  let timestamp: number;
  let success: boolean;
  try {
    timestamp = state.now();
    const body = runtime.document?.body;
    const elements = body
      ? measureCost(state, () =>
          getLeafElements(body, runtime, state.useIgnore, state.elementValidationMap),
        )
      : [];
    success = Boolean(
      measureCost(state, () => state.detector?.checkTimeoutElements(elements, timestamp)),
    );
    stop();
  } catch {
    finishByError(manager, state, stop);
    return;
  }
  if (success && state.detector) {
    state.pageLoadedTime = state.detector.completionTime(timestamp);
    // 纯静态页面（无 DOM 变更）使用初始时间戳 fspStartTimestamp
    if (state.mutationCount === 0) {
      state.pageLoadedTime = state.fspMutationTimestamp;
    }
    if (state.fspClsEnable) {
      startClsStableCheck(manager, state, state.pageLoadedTime);
      return;
    }
    void manager.report({
      status: "success",
      timestamp: state.pageLoadedTime,
      detector: state.detector.snapshot(),
      mutationCount: state.mutationCount,
      cls: createClsMetrics(state, timestamp),
      costMs: state.costMs,
    });
    return;
  }

  state.detector?.markTimeout(timestamp);
  void manager.report({
    status: "timeout",
    timestamp: state.fspMutationTimestamp,
    detector: state.detector?.snapshot(),
    mutationCount: state.mutationCount,
    costMs: state.costMs,
  });
  state.detector?.forceReady(timestamp);
}

function finishByInteract(manager: FspManager, state: FspWatchState, stop: () => void): void {
  stop();
  void manager.report({
    status: "interact",
    timestamp: state.fspMutationTimestamp,
    detector: state.detector?.snapshot(),
    mutationCount: state.mutationCount,
    costMs: state.costMs,
  });
}

function finishByError(manager: FspManager, state: FspWatchState, stop: () => void): void {
  stop();
  void manager.report({
    status: "error",
    timestamp: state.now(),
    detector: state.detector?.snapshot(),
    mutationCount: state.mutationCount,
    costMs: state.costMs,
  });
}

function handleVisibilityChange(
  manager: FspManager,
  runtime: FspRuntime,
  state: FspWatchState,
  stop: () => void,
): void {
  if (runtime.document?.visibilityState !== "hidden") {
    return;
  }
  manager.markHidden();
  stop();
  void manager.report({
    status: "hidden",
    detector: state.detector?.snapshot(),
    mutationCount: state.mutationCount,
    costMs: state.costMs,
  });
}

function measureCost<T>(state: FspWatchState, work: () => T): T {
  const start = state.now();
  const result = work();
  const end = state.now();
  state.costMs += Math.max(0, end - start);
  return result;
}

function startInteractionListener(runtime: FspRuntime, state: FspWatchState): void {
  if (!state.onInteract) {
    return;
  }
  if (runtime.document?.readyState === "complete") {
    addInteractionListener(runtime, state.onInteract);
    return;
  }
  runtime.addEventListener("load", () => addInteractionListener(runtime, state.onInteract));
}

function addInteractionListener(runtime: FspRuntime, listener?: () => void): void {
  if (!listener || !runtime.document?.addEventListener) {
    return;
  }
  runtime.document.addEventListener("click", listener);
  runtime.document.addEventListener("wheel", listener);
  runtime.document.addEventListener("touchmove", listener);
}

function stopWatch(runtime: FspRuntime, state: FspWatchState): void {
  if (state.timer) {
    runtime.clearTimeout(state.timer);
    state.timer = undefined;
  }
  if (state.onVisibilityChange) {
    runtime.removeEventListener("visibilitychange", state.onVisibilityChange);
  }
  if (state.onInteract && runtime.document?.removeEventListener) {
    runtime.document.removeEventListener("click", state.onInteract);
    runtime.document.removeEventListener("wheel", state.onInteract);
    runtime.document.removeEventListener("touchmove", state.onInteract);
  }
  state.observer?.disconnect();
  state.observer = undefined;
  stopClsStableCheck(state);
}

function createClsMetrics(state: FspWatchState, timestamp: number): FspClsMetrics | undefined {
  if (!state.fspClsEnable) {
    return undefined;
  }
  return {
    pageLoadedTime: state.pageLoadedTime,
    pageStable: true,
    loadedStableGap: Math.max(0, timestamp - state.pageLoadedTime),
  };
}

function collectMutationElements(
  records: MutationRecord[],
  runtime: FspRuntime,
  useIgnore: boolean,
  cache: Map<Element, boolean>,
): Element[] {
  const elements = new Set<Element>();
  for (const record of records) {
    if (shouldSkipMutationTarget(record.target)) {
      continue;
    }
    collectRecordElements(record, runtime, useIgnore, cache, elements);
  }
  return Array.from(elements);
}

function collectRecordElements(
  record: MutationRecord,
  runtime: FspRuntime,
  useIgnore: boolean,
  cache: Map<Element, boolean>,
  elements: Set<Element>,
): void {
  const target = record.target as Element | undefined;
  if (
    record.type === "characterData" &&
    target?.parentElement &&
    isValidElement(target.parentElement, runtime, useIgnore, cache)
  ) {
    elements.add(target.parentElement);
    return;
  }

  for (const node of Array.from(record.addedNodes ?? [])) {
    if (!isConnectedNode(node)) {
      continue;
    }
    if (isTextNode(node) && target && isValidElement(target, runtime, useIgnore, cache)) {
      elements.add(target);
    } else if (isElementNode(node)) {
      for (const element of getLeafElements(node as Element, runtime, useIgnore, cache)) {
        elements.add(element);
      }
    }
  }
}

function getLeafElements(
  element: Element,
  runtime: FspRuntime,
  useIgnore: boolean,
  cache?: Map<Element, boolean>,
): Element[] {
  if (isValidElement(element, runtime, useIgnore, cache)) {
    return [element];
  }

  const leafElements: Element[] = [];
  for (const child of Array.from(element.children ?? [])) {
    leafElements.push(...getLeafElements(child, runtime, useIgnore, cache));
  }
  return leafElements;
}

function isValidElement(
  element: Element,
  runtime: FspRuntime,
  useIgnore: boolean,
  cache?: Map<Element, boolean>,
): boolean {
  // 缓存避免重复 getComputedStyle
  const cached = cache?.get(element);
  if (typeof cached === "boolean") {
    return cached;
  }

  const nodeName = element.nodeName.toUpperCase();
  if (["HTML", "HEAD", "META", "LINK", "SCRIPT", "STYLE", "NOSCRIPT", "BODY"].includes(nodeName)) {
    cache?.set(element, false);
    return false;
  }
  if (useIgnore && shouldIgnoreElement(element, runtime.document?.body)) {
    cache?.set(element, false);
    return false;
  }

  const style = runtime.getComputedStyle?.(element);
  if (
    style?.visibility === "hidden" ||
    style?.display === "none" ||
    String(style?.opacity) === "0"
  ) {
    cache?.set(element, false);
    return false;
  }

  const background =
    style?.getPropertyValue("background-image") || style?.getPropertyValue("background") || "";
  const valid =
    hasValidTagName(nodeName) || /url\(.*?\)/g.test(background) || hasDirectText(element);
  cache?.set(element, valid);
  return valid;
}

function shouldIgnoreElement(element: Element, body?: Element): boolean {
  // 使用 __fspIgnored 属性缓存递归结果，避免重复遍历祖先链
  const node = element as unknown as Record<string, unknown>;
  if (typeof node.__fspIgnored === "boolean") {
    return node.__fspIgnored as boolean;
  }
  let current: Element | null = element;
  while (current && current !== body) {
    if (current.hasAttribute?.("perf_ignore")) {
      node.__fspIgnored = true;
      return true;
    }
    current = current.parentElement;
  }
  node.__fspIgnored = false;
  return false;
}

function shouldSkipMutationTarget(target: Node): boolean {
  const nodeName = "nodeName" in target ? String(target.nodeName).toUpperCase() : "";
  return ["HTML", "HEAD", "META", "LINK", "SCRIPT", "STYLE", "NOSCRIPT"].includes(nodeName);
}

function hasValidTagName(nodeName: string): boolean {
  return ["SVG", "INPUT", "CANVAS", "IMG", "VIDEO", "AUDIO", "B", "I", "STRONG", "EM"].includes(
    nodeName,
  );
}

function hasDirectText(element: Element): boolean {
  return Array.from(element.childNodes ?? []).some(isTextNode);
}

function isElementNode(node: Node): boolean {
  return node.nodeType === 1;
}

function isTextNode(node: Node): boolean {
  return node.nodeType === 3 && Boolean(node.nodeValue?.trim());
}

function isConnectedNode(node: Node): boolean {
  return "isConnected" in node ? Boolean(node.isConnected) : true;
}
