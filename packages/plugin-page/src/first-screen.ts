export interface FirstScreenNode {
 tagName: string;
 top: number;
 height: number;
 width: number;
 textLength?: number;
 loadTime?: number;
}

export interface FirstScreenResult {
 time: number;
 score: number;
 detail: FirstScreenNode[];
}

export interface FirstScreenObserverEnv {
 MutationObserver: new (
  callback: (records: MutationRecord[]) => void,
 ) => {
  observe: (target: Node, options: MutationObserverInit) => void;
  disconnect: () => void;
 };
 PerformanceObserver?: new (
  callback: (list: { getEntries: () => PerformanceEntry[] }) => void,
 ) => {
  observe: (options: { entryTypes: string[] }) => void;
  disconnect: () => void;
 };
 document: {
  body: Node;
  querySelectorAll?: (selector: string) => NodeListOf<Element>;
  addEventListener?: (
   type: string,
   listener: EventListener,
   options?: boolean,
  ) => void;
  removeEventListener?: (
   type: string,
   listener: EventListener,
   options?: boolean,
  ) => void;
  readyState?: string;
 };
 viewportHeight: number;
 viewportWidth?: number;
 now?: () => number;
 setTimeout?: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
 clearTimeout?: (id: ReturnType<typeof setTimeout>) => void;
 setInterval?: (fn: () => void, ms: number) => ReturnType<typeof setInterval>;
 clearInterval?: (id: ReturnType<typeof setInterval>) => void;
 addEventListener?: (
  type: string,
  listener: EventListener,
  options?: boolean,
 ) => void;
 removeEventListener?: (
  type: string,
  listener: EventListener,
  options?: boolean,
 ) => void;
 scrollY?: number;
 pageYOffset?: number;
 innerHeight?: number;
 innerWidth?: number;
 performance?: {
  now: () => number;
  getEntriesByType?: (type: string) => PerformanceEntry[];
 };
}

export interface FirstScreenObserverOptions {
 env: FirstScreenObserverEnv;
 onResult: (result: FirstScreenResult) => void;
 /** 停止监听的超时时间（ms），默认 3000。内部实现。 */
 stopTime?: number;
 /** 首屏外 mutation 计数阈值，达到后提前停止。默认 15。 */
 maxOutCount?: number;
 /** 忽略的元素属性名，包含该属性的元素不计入首屏。默认 "monitor-ignore"。 */
 ignoreAttr?: string;
 /** 是否忽略首屏内图片加载（跳过 PerformanceObserver）。默认 false。 */
 disableSensoryImageIndex?: boolean;
 /** 是否启用用户交互停止 DOM 监听。默认 false。 */
 interactToStopObserver?: boolean;
}

// ─── 常量 ─────────────────────────────────────

const DEFAULT_STOP_TIME = 3000;
const DEFAULT_MAX_OUT_COUNT = 15;
const MIN_SCORE = 3;
const ELEMENT_WEIGHT = 1;
const DEP_WEIGHT = 0;
const NON_VISUAL_TAGS = [
 "HTML",
 "HEAD",
 "META",
 "LINK",
 "SCRIPT",
 "STYLE",
 "NOSCRIPT",
];

// ─── 公开 API ────────────────────────────────────────────────

export function calculateNodeWeight(
 node: FirstScreenNode,
 viewportHeight: number,
): number {
 if (node.top >= viewportHeight || node.height <= 0 || node.width <= 0) {
  return 0;
 }

 const visibleHeight = Math.min(
  node.height,
  viewportHeight - Math.max(0, node.top),
 );
 const area = visibleHeight * node.width;
 const textBonus = node.textLength ? Math.min(node.textLength, 200) : 0;
 return Math.round(area + textBonus);
}

export function calculateFirstScreen(
 nodes: FirstScreenNode[],
 viewportHeight: number,
): FirstScreenResult {
 const visible = nodes
  .map((node) => ({ node, score: calculateNodeWeight(node, viewportHeight) }))
  .filter((item) => item.score > 0);
 const time = Math.max(0, ...visible.map((item) => item.node.loadTime ?? 0));
 const score = visible.reduce((sum, item) => sum + item.score, 0);

 return {
  time,
  score,
  detail: visible.map((item) => item.node),
 };
}

/**
 * 启动首屏观察器（内部实现。
 *
 * 工作流程：
 * 1. 创建 MutationObserver 监听 body 的 DOM 变化
 * 2. 可选：创建 PerformanceObserver 监听资源请求
 * 3. 在 stopTime 内无新 DOM 变化时自动停止
 * 4. 首屏外节点达到 maxOutCount 次时提前停止
 * 5. 可选：用户交互（click/wheel/touchmove）触发停止
 * 6. 停止后调用 onResult 回传计算结果
 *
 * @returns 停止观察的函数
 */
export function startFirstScreenObserver(
 options: FirstScreenObserverOptions,
): () => void {
 const env = options.env;
 const now = env.now ?? Date.now;
 const stopTime = options.stopTime ?? DEFAULT_STOP_TIME;
 const maxOutCount = options.maxOutCount ?? DEFAULT_MAX_OUT_COUNT;
 const ignoreAttr = options.ignoreAttr ?? "monitor-ignore";

 let domDone = false;
 let perfDone = options.disableSensoryImageIndex ?? false;
 let outCount = 0;
 let domTimer: ReturnType<typeof setTimeout> | undefined;
 let perfTimer: ReturnType<typeof setTimeout> | undefined;
 let senseTime: { FST?: number; FCP?: number } | undefined;
 let fcp = -1;

 const mutaRecords: Array<{
  nodes: Element[];
  startTime: number;
 }> = [];

 const setTimeoutFn = env.setTimeout ?? setTimeout;
 const clearTimeoutFn = env.clearTimeout ?? clearTimeout;
 const setIntervalFn = env.setInterval ?? setInterval;
 const clearIntervalFn = env.clearInterval ?? clearInterval;

 // 检查是否可启动
 const canStart =
  typeof env.MutationObserver === "function" &&
  typeof env.document?.body !== "undefined";
 if (!canStart) {
  return () => undefined;
 }

 // ─── DOM 观察器 ──────────────────────────────────────────

 const observer = new env.MutationObserver((records) => {
  const time = now();
  mutaCallback(records, time, true);
 });

 observer.observe(env.document.body, { childList: true, subtree: true });
 resetDomTimer(true);

 // ─── 资源观察器 ──────────────────────────────────────────

 if (!perfDone && env.PerformanceObserver) {
  // 8s 超时兜底
  perfTimer = setTimeoutFn(() => {
   stopPerfObserver();
  }, 8000);

  const perfObserver = new env.PerformanceObserver(() => {
   clearTimeoutFn(perfTimer!);
   perfTimer = setTimeoutFn(() => {
    clearTimeoutFn(perfTimer!);
    stopPerfObserver();
   }, stopTime);
  });
  perfObserver.observe({ entryTypes: ["resource"] });

  var stopPerfObserver = () => {
   try {
    perfObserver.disconnect();
   } catch {
    // ignore
   }
   perfDone = true;
  };
 } else {
  perfDone = true;
 }

 // ─── 用户交互停止 ────────────────────────────────────────

 if (options.interactToStopObserver && env.document?.addEventListener) {
  const doc = env.document;
  const addEL = (type: string, listener: EventListener, options?: boolean) =>
   doc.addEventListener?.(type, listener, options);
  const rmEL = (type: string, listener: EventListener, options?: boolean) =>
   doc.removeEventListener?.(type, listener, options);

  if (doc.readyState === "complete") {
   bindInteractStop();
  } else {
   const loadFn = env.addEventListener?.bind(env) ?? doc.addEventListener?.bind(doc);
   loadFn?.("load", bindInteractStop);
  }

  function bindInteractStop() {
   if (domDone) return;
   const cb = () => {
    if (domDone) {
     rmEL("click", cb, true);
     rmEL("wheel", cb, true);
     rmEL("touchmove", cb, true);
     return;
    }
    stopMutaObserver();
    rmEL("click", cb, true);
    rmEL("wheel", cb, true);
    rmEL("touchmove", cb, true);
   };
   addEL("click", cb, true);
   addEL("focus", cb, true);
   addEL("wheel", cb, true);
   addEL("touchmove", cb, true);
  }
 }

 // ─── FST 轮询检查 ────────────────────────────────────────

 let doneTimer: ReturnType<typeof setInterval> | undefined;
 // 8s 全局超时兜底
 const fstTimer = setTimeoutFn(() => {
  clearIntervalFn(doneTimer!);
  stopMutaObserver();
  stopPerfObserver?.();
  options.onResult(calculateFirstScreen([], env.viewportHeight));
 }, 8000);

 doneTimer = setIntervalFn(() => {
  if (domDone && perfDone) {
   clearIntervalFn(doneTimer!);
   clearTimeoutFn(fstTimer);
   if (senseTime) {
    options.onResult(calculateFirstScreen([], env.viewportHeight));
   } else {
    options.onResult(calculateFirstScreen([], env.viewportHeight));
   }
  }
 }, 500);

 // ─── 内部函数 ────────────────────────────────────────────

 function resetDomTimer(newTimer: boolean) {
  if (domTimer !== undefined) clearTimeoutFn(domTimer);
  if (newTimer) {
   domTimer = setTimeoutFn(() => {
    stopMutaObserver();
   }, stopTime);
  }
 }

 function stopMutaObserver() {
  if (domDone) return;
  domDone = true;
  try {
   observer.disconnect();
  } catch {
   // ignore
  }
  resetDomTimer(false);
  // 计算 FST
  computeFST();
 }

 function computeFST() {
  const viewportHeight = env.viewportHeight;
  const viewportWidth = env.viewportWidth ?? env.innerWidth ?? 0;
  const scrollY = env.scrollY ?? env.pageYOffset ?? 0;

  const validRecords: Array<{
   score: number;
   startTime: number;
   nodes: FirstScreenNode[];
  }> = [];

  for (const record of mutaRecords) {
   const validNodes: FirstScreenNode[] = [];
   for (const node of record.nodes) {
    if (!isElementLike(node)) continue;
    const style = getComputedStyleLike(node);
    if (style.visibility === "hidden" || style.display === "none") continue;

    const rect = node.getBoundingClientRect();
    if (!inViewport(rect, viewportHeight, viewportWidth, scrollY)) continue;

    validNodes.push({
     tagName: node.tagName,
     top: rect.top,
     height: rect.height,
     width: rect.width,
     textLength: node.textContent?.length,
     loadTime: record.startTime,
    });
   }

   if (validNodes.length > 0) {
    const score = calcNodeListScore(validNodes, viewportHeight);
    if (score > MIN_SCORE) {
     validRecords.push({
      score,
      startTime: record.startTime,
      nodes: validNodes,
     });
    }
   }
  }

  // 计算 FST：取所有权重足够的变化中最晚的时间
  let fst = 0;
  if (validRecords.length > 0) {
   const sorted = validRecords.sort((a, b) => b.startTime - a.startTime);
   fst = sorted[0].startTime;
  }

  senseTime = {
   FST: fst > 0 ? Math.round(fst) : undefined,
   FCP: fcp > 0 ? Math.round(fcp) : undefined,
  };

  // 收集所有有效节点作为 detail
  const allNodes = validRecords.flatMap((r) => r.nodes);
  options.onResult(calculateFirstScreen(allNodes, viewportHeight));
 }

 function mutaCallback(
  mutations: MutationRecord[],
  startTime: number,
  reset: boolean,
 ) {
  if (reset) resetDomTimer(true);
  if (domDone) return;

  for (const mutation of mutations) {
    const target = mutation.target as Element | undefined;
    const targetNodeName = (target?.nodeName || "").toUpperCase();
    if (
     mutation.type && mutation.type !== "childList"
    ) {
     continue;
    }
    if (
     targetNodeName &&
     NON_VISUAL_TAGS.includes(targetNodeName)
    ) {
     continue;
    }
    if (!mutation.addedNodes?.length) {
     continue;
    }

    const addedNodes = Array.from(mutation.addedNodes).filter(
     (node): node is Element & ElementLike => {
      // nodeType 为 1 表示 Element，但测试环境可能不提供此属性
      if (node.nodeType !== undefined && node.nodeType !== 1) return false;
      const el = node as Element & ElementLike;
      const nodeName = (el.nodeName || el.tagName || "").toUpperCase();
      if (!nodeName) return false;
      if (NON_VISUAL_TAGS.includes(nodeName)) return false;
      if (nodeName === "IFRAME") return false;
      if ((el as Node).isConnected === false) return false;
      if (shouldIgnoreNode(el, ignoreAttr)) return false;
      return true;
     },
    );

    if (!addedNodes.length || !addedNodes[0]) continue;

    mutaRecords.push({ nodes: addedNodes, startTime });

    const firstNode = addedNodes[0];

    // 模拟 FCP
    if (fcp < 0) {
     fcp = calcFCP(firstNode, startTime);
    }

    // 首屏外检测
    try {
     const rect = firstNode.getBoundingClientRect?.();
     if (
      rect &&
      rect.width &&
      rect.height &&
      rect.top >= (env.viewportHeight || 0)
     ) {
      outCount++;
      if (outCount >= maxOutCount) {
       stopMutaObserver();
       return;
      }
     }
    } catch {
     // ignore
    }
   }
 }

 return () => {
  stopMutaObserver();
  stopPerfObserver?.();
 };
}

// ─── 辅助函数 ────────────────────────────────────────────────

interface ElementLike {
 tagName: string;
 textContent?: string | null;
 getBoundingClientRect: () => { top: number; height: number; width: number };
 style?: { visibility?: string; display?: string };
 getAttribute?: (name: string) => string | null;
 querySelectorAll?: (selector: string) => NodeListOf<Element>;
}

function isElementLike(node: Node): node is Node & ElementLike {
 const candidate = node as Partial<ElementLike>;
 return (
  typeof candidate.tagName === "string" &&
  typeof candidate.getBoundingClientRect === "function"
 );
}

function getComputedStyleLike(el: ElementLike): {
 visibility?: string;
 display?: string;
} {
 return el.style ?? {};
}

function shouldIgnoreNode(
 node: Element & ElementLike,
 ignoreAttr: string,
): boolean {
 if (!ignoreAttr) return false;
 try {
  if (typeof node.getAttribute === "function") {
   return node.getAttribute(ignoreAttr) !== null;
  }
  // 检查子节点
  if (typeof node.querySelectorAll === "function") {
   const marked = node.querySelectorAll(`[${ignoreAttr}]`);
   return marked.length > 0;
  }
 } catch {
  // ignore
 }
 return false;
}

function inViewport(
 rect: { top: number; left: number; right: number; bottom: number },
 viewportHeight: number,
 viewportWidth: number,
 scrollY: number,
): boolean {
 // display:none 元素通常 top/bottom/left/right 均为 0
 if (rect.top === 0 && rect.bottom === 0 && rect.left === 0 && rect.right === 0) return false;
 // 在视口内（考虑滚动偏移）
 if (scrollY + rect.top >= viewportHeight) return false;
 // 如果提供了水平方向信息，检查是否在视口宽度内
 if (rect.right !== undefined && rect.right <= 0) return false;
 if (rect.left !== undefined && rect.left >= viewportWidth) return false;
 return true;
}

/**
 * 节点列表的权重计算（内部实现。
 * 加权面积 + 深度权重。
 */
function calcNodeListScore(
 nodes: FirstScreenNode[],
 viewportHeight: number,
): number {
 let score = 0;
 for (const node of nodes) {
  const visibleHeight = Math.min(
   node.height,
   viewportHeight - Math.max(0, node.top),
  );
  if (visibleHeight <= 0 || node.width <= 0) continue;
  const area = visibleHeight * node.width;
  score += Math.round(area * ELEMENT_WEIGHT + DEP_WEIGHT);
 }
 return score;
}

/**
 * 模拟首屏内容绘制时间 FCP。
 * 取首个内容节点（含文本或图片）的出现时间。
 */
function calcFCP(node: ElementLike, startTime: number): number {
 try {
  const text = (node.textContent ?? "").trim();
  if (text.length > 0) return startTime;
  // 检查是否包含 img
  if (
   node.tagName === "IMG" ||
   (typeof node.querySelectorAll === "function" &&
    node.querySelectorAll("img").length > 0)
  ) {
   return startTime;
  }
 } catch {
  // ignore
 }
 return -1;
}
