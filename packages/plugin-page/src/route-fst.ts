import {
 createHashRouteWatcher,
 createHistoryRouteWatcher,
 type RouteWatcherEnv,
 type StopWatcher,
} from "@monitor/core";
import type { FirstScreenObserverEnv } from "./first-screen";

export interface RouteFstOptions {
 env?: RouteWatcherEnv;
 routeMode?: "history" | "hash" | "auto";
 onRoute: (url: string, prevUrl?: string) => void;
}

/**
 * 启动路由首屏监听（内部实现。
 *
 * 当路由变化时回调 onRoute，业务侧应在回调中启动首屏计算。
 * 第二个参数 prevUrl 表示前一页面路径，可用于停止上一页面的监听。
 */
export function startRouteFst(options: RouteFstOptions): StopWatcher {
 const env = options.env ?? getRuntimeRouteEnv();
 if (!env) {
  return () => undefined;
 }

 let prevPath: string | undefined;

 if (options.routeMode === "hash") {
  return createHashRouteWatcher(env, (url) => {
   const prev = prevPath;
   prevPath = url;
   options.onRoute(url, prev);
  });
 }

 if (options.routeMode === "auto") {
  const stopHistory = createHistoryRouteWatcher(env, (url) => {
   const prev = prevPath;
   prevPath = url;
   options.onRoute(url, prev);
  });
  const stopHash = createHashRouteWatcher(env, (url) => {
   const prev = prevPath;
   prevPath = url;
   options.onRoute(url, prev);
  });
  return () => {
   stopHistory();
   stopHash();
  };
 }

 return createHistoryRouteWatcher(env, (url) => {
  const prev = prevPath;
  prevPath = url;
  options.onRoute(url, prev);
 });
}

function getRuntimeRouteEnv(): RouteWatcherEnv | undefined {
 if (typeof window === "undefined") {
  return undefined;
 }

 return window;
}

/**
 * SPA 路由首屏管理器（内部实现。
 *
 * 每个路由路径维护独立的：
 * - MutationObserver（监听该路由下的 DOM 变化）
 * - 计时器（超时自动停止）
 * - 首屏外节点计数
 *
 * 路由切换时自动停止上一页面的监听并计算 FST。
 */
export interface RouteFirstScreenOptions {
 env?: FirstScreenObserverEnv;
 /** 停止监听的超时时间（ms），默认 3000。 */
 stopTime?: number;
 /** 首屏外 mutation 计数阈值，默认 15。 */
 maxOutCount?: number;
 /** 忽略的元素属性名。 */
 ignoreAttr?: string;
}

export interface RouteFstResult {
 fst: number;
 path: string;
}

interface RouteObserver {
 observe: (target: Node, options: MutationObserverInit) => void;
 disconnect: () => void;
}

interface RouteState {
 start: number;
 observer: RouteObserver;
 mutaRecords: Array<{ nodes: Element[]; startTime: number }>;
 domTimer: ReturnType<typeof setTimeout> | undefined;
 domDone: boolean;
 outCount: number;
 fst: number;
 _interactCb?: EventListener;
}

export class RouteFirstScreenManager {
 private readonly env: FirstScreenObserverEnv | undefined;
 private readonly stopTime: number;
 private readonly maxOutCount: number;
 private readonly ignoreAttr: string;
 private readonly routes: Map<string, RouteState> = new Map();

 private onResult: (result: RouteFstResult) => void;

 constructor(
  onResult: (result: RouteFstResult) => void,
  options: RouteFirstScreenOptions = {},
 ) {
  this.onResult = onResult;
  this.env = options.env ?? getDefaultObserverEnv();
  this.stopTime = options.stopTime ?? 3000;
  this.maxOutCount = options.maxOutCount ?? 15;
  this.ignoreAttr = options.ignoreAttr ?? "monitor-ignore";
 }

 /** 开始监听指定路由的首屏变化。 */
 startRoute(path: string): void {
  if (!this.env?.MutationObserver || !this.env.document?.body) return;
  if (this.routes.has(path)) return;

  const env = this.env;
  const start = (env.now ?? Date.now)();
  const routeInfo: RouteState = {
   start,
   observer: new env.MutationObserver((mutations: MutationRecord[]) => {
    this.routeMutaCallback(path, mutations);
   }),
   mutaRecords: [],
   domTimer: undefined,
   domDone: false,
   outCount: 0,
   fst: 0,
  };

  routeInfo.observer.observe(env.document.body, {
   childList: true,
   subtree: true,
  });
  this.routes.set(path, routeInfo);
  this.resetRouteTimer(path, true);

  // 绑定用户交互停止
  setTimeout(() => {
   this.bindRouteInteractStop(path);
  }, 0);
 }

 /** 停止指定路由的监听，并计算 FST。 */
 stopRoute(path: string): void {
  const ri = this.routes.get(path);
  if (!ri || ri.domDone) {
   this.routes.delete(path);
   return;
  }

  ri.domDone = true;
  this.removeRouteInteractListener(path);
  this.resetRouteTimer(path, false);

  try {
   ri.observer.disconnect();
  } catch {
   // ignore
  }

  // 计算 FST
  const result = this.computeRouteFst(path);
  if (result > 0) {
   ri.fst = result;
   this.onResult({ fst: result, path });
  }

  this.routes.delete(path);
 }

 /** 路由切换时使用：停止旧路由，开始新路由。 */
 switchRoute(oldPath: string | undefined, newPath: string): void {
  if (oldPath) this.stopRoute(oldPath);
  this.startRoute(newPath);
 }

 // ─── 内部方法 ────────────────────────────────────────────

 private resetRouteTimer(path: string, newTimer: boolean): void {
  const ri = this.routes.get(path);
  if (!ri) return;

  const clearTimeoutFn = this.env?.clearTimeout ?? clearTimeout;
  const setTimeoutFn = this.env?.setTimeout ?? setTimeout;

  if (ri.domTimer !== undefined) clearTimeoutFn(ri.domTimer);
  if (newTimer) {
   ri.domTimer = setTimeoutFn(() => {
    this.stopRoute(path);
   }, this.stopTime);
  } else {
   ri.domTimer = undefined;
  }
 }

 private routeMutaCallback(path: string, mutations: MutationRecord[]): void {
  const ri = this.routes.get(path);
  if (!ri || ri.domDone) return;

  const startTime = (this.env?.now ?? Date.now)();
  this.resetRouteTimer(path, true);

  const NON_VISUAL = [
   "HTML", "HEAD", "META", "LINK", "SCRIPT", "STYLE", "NOSCRIPT",
  ];

  for (const mutation of mutations) {
   if (ri.domDone) return;

   const targetNodeName = (
    (mutation.target as Element).nodeName || ""
   ).toUpperCase();
   if (
    mutation.type !== "childList" ||
    !targetNodeName ||
    NON_VISUAL.includes(targetNodeName) ||
    !mutation.addedNodes?.length
   ) {
    continue;
   }

   const addedNodes = Array.from(mutation.addedNodes).filter(
    (node): node is Element => {
     if (node.nodeType !== 1) return false;
     const nodeName = (node.nodeName || "").toUpperCase();
     return (
      !!nodeName &&
      !NON_VISUAL.includes(nodeName) &&
      nodeName !== "IFRAME" &&
      (node as Node).isConnected !== false
     );
    },
   );

   if (!addedNodes.length || !addedNodes[0]) continue;

   ri.mutaRecords.push({ nodes: addedNodes, startTime });

   // 首屏外检测
   try {
    const el = addedNodes[0] as unknown as HTMLElement;
    const rect = el.getBoundingClientRect?.();
    if (
     rect &&
     rect.width &&
     rect.height &&
     rect.top >= (this.env?.viewportHeight || 0)
    ) {
     ri.outCount++;
     if (ri.outCount >= this.maxOutCount) {
      this.stopRoute(path);
      return;
     }
    }
   } catch {
    // ignore
   }
  }
 }

 private computeRouteFst(path: string): number {
  const ri = this.routes.get(path);
  if (!ri || !this.env) return 0;

  const viewportHeight = this.env.viewportHeight;
  const viewportWidth = this.env.viewportWidth ?? this.env.innerWidth ?? 0;
  const scrollY = this.env.scrollY ?? this.env.pageYOffset ?? 0;

  const validRecords: Array<{ score: number; startTime: number }> = [];

  for (const record of ri.mutaRecords) {
   const validNodes: Array<{
    top: number;
    height: number;
    width: number;
   }> = [];

   for (const node of record.nodes) {
    const el = node as unknown as HTMLElement;
    const style = el.style ?? {};
    if (style.visibility === "hidden" || style.display === "none") continue;

    const rect = el.getBoundingClientRect?.();
    if (!rect) continue;
    if (!rect.top && !rect.bottom) continue;

    if (
     scrollY + rect.top < viewportHeight &&
     rect.right > 0 &&
     rect.left < viewportWidth
    ) {
     const visibleHeight = Math.min(
      rect.height,
      viewportHeight - Math.max(0, rect.top),
     );
     if (visibleHeight > 0 && rect.width > 0) {
      validNodes.push({
       top: rect.top,
       height: rect.height,
       width: rect.width,
      });
     }
    }
   }

   if (validNodes.length > 0) {
    const score = validNodes.reduce((sum, n) => {
     const vh = Math.min(n.height, viewportHeight - Math.max(0, n.top));
     return sum + Math.round(vh * n.width);
    }, 0);

    if (score > 3) {
     validRecords.push({ score, startTime: record.startTime });
    }
   }
  }

  if (validRecords.length === 0) return 0;

  const sorted = validRecords.sort((a, b) => b.startTime - a.startTime);
  return Math.round(sorted[0].startTime - ri.start);
 }

 private bindRouteInteractStop(path: string): void {
  const ri = this.routes.get(path);
  if (!ri || ri.domDone) return;

  const doc = this.env?.document;
  if (!doc?.addEventListener) return;

  const cb = () => {
   this.stopRoute(path);
  };

  doc.addEventListener("click", cb, true);
  doc.addEventListener("focus", cb, true);
  doc.addEventListener("wheel", cb, true);
  doc.addEventListener("touchmove", cb, true);

  // 保存引用以便清理
  ri._interactCb = cb;
 }

 private removeRouteInteractListener(path: string): void {
  const ri = this.routes.get(path);
  if (!ri) return;

  const cb = ri._interactCb;
  if (!cb) return;

  const doc = this.env?.document;
  if (!doc?.removeEventListener) return;

  doc.removeEventListener("click", cb, true);
  doc.removeEventListener("focus", cb, true);
  doc.removeEventListener("wheel", cb, true);
  doc.removeEventListener("touchmove", cb, true);
 }
}

function getDefaultObserverEnv(): FirstScreenObserverEnv | undefined {
 if (typeof window === "undefined") return undefined;
 return window as unknown as FirstScreenObserverEnv;
}
