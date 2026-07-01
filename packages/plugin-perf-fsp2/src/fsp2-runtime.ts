import { Fsp2ViewportDetector } from "./fsp2-detector";
import { startClsStableCheck, stopClsStableCheck, type Fsp2ClsRuntimeState } from "./fsp2-cls";
import type { Fsp2ClsMetrics, Fsp2Manager } from "./index";

export interface Fsp2Runtime {
  document?: Fsp2RuntimeDocument;
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
  getComputedStyle?: (element: Element) => Pick<CSSStyleDeclaration, "visibility" | "display" | "opacity" | "getPropertyValue">;
  addEventListener: (type: "visibilitychange" | "load", listener: () => void) => void;
  removeEventListener: (type: "visibilitychange" | "load", listener: () => void) => void;
  setTimeout: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  clearTimeout: (timer: ReturnType<typeof setTimeout>) => void;
  setInterval?: (callback: () => void, delay: number) => ReturnType<typeof setInterval>;
  clearInterval?: (timer: ReturnType<typeof setInterval>) => void;
}

export interface Fsp2RuntimeDocument {
  visibilityState?: string;
  readyState?: string;
  body?: Element;
  documentElement?: { clientWidth?: number; clientHeight?: number };
  elementsFromPoint?: (x: number, y: number) => Element[];
  addEventListener?: (type: "click" | "wheel" | "touchmove", listener: () => void) => void;
  removeEventListener?: (type: "click" | "wheel" | "touchmove", listener: () => void) => void;
}

export interface Fsp2WatchOptions {
  timeout: number;
  useIgnore: boolean;
  fspClsEnable: boolean;
  defer: boolean;
  runtime?: Fsp2Runtime;
  now?: () => number;
}

interface Fsp2WatchState extends Fsp2ClsRuntimeState {
  runtime: Fsp2Runtime;
  detector?: Fsp2ViewportDetector;
  observer?: InstanceType<NonNullable<Fsp2Runtime["MutationObserver"]>>;
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
}

export function watchFsp2Runtime(manager: Fsp2Manager, options: Fsp2WatchOptions): (() => void) | undefined {
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
  if (options.defer) {
    state.timer = runtime.setTimeout(start, 0);
  } else {
    start();
  }
  return stop;
}

function getRuntime(): Fsp2Runtime | undefined {
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
    clearInterval
  };
}

function getGlobalContainerBridge(): Record<string, unknown> | undefined {
  const scope = window as unknown as Record<string, unknown>;
  for (const key of ["MSI", "msi", "KNB", "NativeBridge", "bridge"]) {
    const bridge = scope[key];
    if (bridge && typeof bridge === "object") {
      return bridge as Record<string, unknown>;
    }
  }
  return undefined;
}

function createWatchState(runtime: Fsp2Runtime, options: Fsp2WatchOptions): Fsp2WatchState {
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
    now
  };
}

function supportFsp(runtime: Fsp2Runtime, state: Fsp2WatchState): boolean {
  return Boolean(
    state.detector
    && runtime.document?.elementsFromPoint
    && runtime.MutationObserver
  );
}

function startFspCheck(
  manager: Fsp2Manager,
  runtime: Fsp2Runtime,
  state: Fsp2WatchState,
  stop: () => void
): void {
  state.timer = resetTimer(manager, runtime, state, stop);
  if (state.detector && runtime.document?.body && runtime.MutationObserver) {
    if (checkInitialScreen(runtime, state)) {
      finishSuccess(manager, state, stop, state.now());
      return;
    }
    state.observer = createMutationObserver(runtime.MutationObserver, manager, runtime, state, stop);
    state.observer.observe(runtime.document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    startInteractionListener(runtime, state);
  }
}

function createRuntimeDetector(runtime: Fsp2Runtime): Fsp2ViewportDetector | undefined {
  const viewportWidth = Math.max(runtime.document?.documentElement?.clientWidth ?? 0, runtime.innerWidth ?? 0);
  const viewportHeight = Math.max(runtime.document?.documentElement?.clientHeight ?? 0, runtime.innerHeight ?? 0);
  if (!viewportWidth || !viewportHeight) {
    return undefined;
  }
  return new Fsp2ViewportDetector(viewportWidth, viewportHeight);
}

function createMutationObserver(
  Observer: NonNullable<Fsp2Runtime["MutationObserver"]>,
  manager: Fsp2Manager,
  runtime: Fsp2Runtime,
  state: Fsp2WatchState,
  stop: () => void
) {
  return new Observer((records) => {
    const timestamp = state.now();
    state.originMutationCount += 1;
    const elements = measureCost(state, () => collectMutationElements(records, runtime, state.useIgnore));
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
  });
}

function resetTimer(
  manager: Fsp2Manager,
  runtime: Fsp2Runtime,
  state: Fsp2WatchState,
  stop: () => void
): ReturnType<typeof setTimeout> | undefined {
  if (state.originMutationCount >= 10) {
    return state.timer;
  }
  if (state.timer) {
    runtime.clearTimeout(state.timer);
  }
  return runtime.setTimeout(() => finishByTimeout(manager, runtime, state, stop), 5000);
}

function checkInitialScreen(runtime: Fsp2Runtime, state: Fsp2WatchState): boolean {
  const doc = runtime.document;
  if (!state.detector || !doc?.elementsFromPoint) {
    return false;
  }

  return measureCost(state, () => state.detector?.checkInitialPoints((point) => {
    const elements = doc.elementsFromPoint?.(point.x, point.y) ?? [];
    return elements.some((element) => isValidElement(element, runtime, state.useIgnore));
  }, state.now())) ?? false;
}

function finishSuccess(manager: Fsp2Manager, state: Fsp2WatchState, stop: () => void, timestamp: number): void {
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
    costMs: state.costMs
  });
}

function finishByTimeout(
  manager: Fsp2Manager,
  runtime: Fsp2Runtime,
  state: Fsp2WatchState,
  stop: () => void
): void {
  const timestamp = state.now();
  const body = runtime.document?.body;
  const elements = body
    ? measureCost(state, () => getLeafElements(body, runtime, state.useIgnore))
    : [];
  const success = Boolean(measureCost(state, () => state.detector?.checkTimeoutElements(elements, timestamp)));
  stop();
  if (success && state.detector) {
    state.pageLoadedTime = state.detector.completionTime(timestamp);
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
      costMs: state.costMs
    });
    return;
  }

  state.detector?.markTimeout(timestamp);
  void manager.report({
    status: "timeout",
    timestamp: state.fspMutationTimestamp,
    detector: state.detector?.snapshot(),
    mutationCount: state.mutationCount,
    costMs: state.costMs
  });
  state.detector?.forceReady(timestamp);
}

function finishByInteract(manager: Fsp2Manager, state: Fsp2WatchState, stop: () => void): void {
  stop();
  void manager.report({
    status: "interact",
    timestamp: state.fspMutationTimestamp,
    detector: state.detector?.snapshot(),
    mutationCount: state.mutationCount,
    costMs: state.costMs
  });
}

function handleVisibilityChange(
  manager: Fsp2Manager,
  runtime: Fsp2Runtime,
  state: Fsp2WatchState,
  stop: () => void
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
    costMs: state.costMs
  });
}

function measureCost<T>(state: Fsp2WatchState, work: () => T): T {
  const start = state.now();
  const result = work();
  const end = state.now();
  state.costMs += Math.max(0, end - start);
  return result;
}

function startInteractionListener(runtime: Fsp2Runtime, state: Fsp2WatchState): void {
  if (!state.onInteract) {
    return;
  }
  if (runtime.document?.readyState === "complete") {
    addInteractionListener(runtime, state.onInteract);
    return;
  }
  runtime.addEventListener("load", () => addInteractionListener(runtime, state.onInteract));
}

function addInteractionListener(runtime: Fsp2Runtime, listener?: () => void): void {
  if (!listener || !runtime.document?.addEventListener) {
    return;
  }
  runtime.document.addEventListener("click", listener);
  runtime.document.addEventListener("wheel", listener);
  runtime.document.addEventListener("touchmove", listener);
}

function stopWatch(runtime: Fsp2Runtime, state: Fsp2WatchState): void {
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

function createClsMetrics(state: Fsp2WatchState, timestamp: number): Fsp2ClsMetrics | undefined {
  if (!state.fspClsEnable) {
    return undefined;
  }
  return {
    pageLoadedTime: state.pageLoadedTime,
    pageStable: true,
    loadedStableGap: Math.max(0, timestamp - state.pageLoadedTime)
  };
}

function collectMutationElements(records: MutationRecord[], runtime: Fsp2Runtime, useIgnore: boolean): Element[] {
  const elements = new Set<Element>();
  for (const record of records) {
    if (shouldSkipMutationTarget(record.target)) {
      continue;
    }
    collectRecordElements(record, runtime, useIgnore, elements);
  }
  return Array.from(elements);
}

function collectRecordElements(
  record: MutationRecord,
  runtime: Fsp2Runtime,
  useIgnore: boolean,
  elements: Set<Element>
): void {
  const target = record.target as Element | undefined;
  if (record.type === "characterData" && target?.parentElement && isValidElement(target.parentElement, runtime, useIgnore)) {
    elements.add(target.parentElement);
    return;
  }

  for (const node of Array.from(record.addedNodes ?? [])) {
    if (!isConnectedNode(node)) {
      continue;
    }
    if (isTextNode(node) && target && isValidElement(target, runtime, useIgnore)) {
      elements.add(target);
    } else if (isElementNode(node)) {
      for (const element of getLeafElements(node as Element, runtime, useIgnore)) {
        elements.add(element);
      }
    }
  }
}

function getLeafElements(element: Element, runtime: Fsp2Runtime, useIgnore: boolean): Element[] {
  if (isValidElement(element, runtime, useIgnore)) {
    return [element];
  }

  const leafElements: Element[] = [];
  for (const child of Array.from(element.children ?? [])) {
    leafElements.push(...getLeafElements(child, runtime, useIgnore));
  }
  return leafElements;
}

function isValidElement(element: Element, runtime: Fsp2Runtime, useIgnore: boolean): boolean {
  const nodeName = element.nodeName.toUpperCase();
  if (["HTML", "HEAD", "META", "LINK", "SCRIPT", "STYLE", "NOSCRIPT", "BODY"].includes(nodeName)) {
    return false;
  }
  if (useIgnore && shouldIgnoreElement(element, runtime.document?.body)) {
    return false;
  }

  const style = runtime.getComputedStyle?.(element);
  if (style?.visibility === "hidden" || style?.display === "none" || String(style?.opacity) === "0") {
    return false;
  }

  const background = style?.getPropertyValue("background-image") || style?.getPropertyValue("background") || "";
  return hasValidTagName(nodeName) || /url\(.*?\)/g.test(background) || hasDirectText(element);
}

function shouldIgnoreElement(element: Element, body?: Element): boolean {
  let current: Element | null = element;
  while (current && current !== body) {
    if (current.hasAttribute?.("perf_ignore")) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

function shouldSkipMutationTarget(target: Node): boolean {
  const nodeName = "nodeName" in target ? String(target.nodeName).toUpperCase() : "";
  return ["HTML", "HEAD", "META", "LINK", "SCRIPT", "STYLE", "NOSCRIPT"].includes(nodeName);
}

function hasValidTagName(nodeName: string): boolean {
  return ["SVG", "INPUT", "CANVAS", "IMG", "VIDEO", "AUDIO", "B", "I", "STRONG", "EM"].includes(nodeName);
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
