export interface RouteLocationLike {
  href?: string;
  hash?: string;
}

export interface HistoryLike {
  pushState: (...args: unknown[]) => unknown;
  replaceState: (...args: unknown[]) => unknown;
}

export interface RouteWatcherEnv {
  location?: RouteLocationLike;
  history?: HistoryLike;
  addEventListener?: (name: string, listener: EventListener) => void;
  removeEventListener?: (name: string, listener: EventListener) => void;
}

export interface RouteChange {
  type: "pushState" | "replaceState" | "popstate" | "hashchange";
  from: string;
  to: string;
  event?: Event;
}

export type RouteChangeHandler = (change: RouteChange) => void;
export type StopWatcher = () => void;

export function createHistoryRouteWatcher(
  env: RouteWatcherEnv | undefined,
  handler: RouteChangeHandler
): StopWatcher {
  const target = env ?? getWindowLike();
  const history = target?.history;

  if (!target || !history) {
    return noop;
  }

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  let lastUrl = getCurrentUrl(target);

  const notify = (type: RouteChange["type"], event?: Event) => {
    const from = lastUrl;
    const to = getCurrentUrl(target);
    lastUrl = to;
    handler({ type, from, to, event });
  };

  history.pushState = function patchedPushState(...args: unknown[]) {
    const result = originalPushState.apply(this, args);
    notify("pushState");
    return result;
  };

  history.replaceState = function patchedReplaceState(...args: unknown[]) {
    const result = originalReplaceState.apply(this, args);
    notify("replaceState");
    return result;
  };

  const onPopState: EventListener = (event) => notify("popstate", event);
  target.addEventListener?.("popstate", onPopState);

  return () => {
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
    target.removeEventListener?.("popstate", onPopState);
  };
}

export function createHashRouteWatcher(
  env: RouteWatcherEnv | undefined,
  handler: RouteChangeHandler
): StopWatcher {
  const target = env ?? getWindowLike();

  if (!target) {
    return noop;
  }

  let lastUrl = getCurrentUrl(target);
  const onHashChange: EventListener = (event) => {
    const from = lastUrl;
    const to = getCurrentUrl(target);
    lastUrl = to;
    handler({ type: "hashchange", from, to, event });
  };

  target.addEventListener?.("hashchange", onHashChange);

  return () => {
    target.removeEventListener?.("hashchange", onHashChange);
  };
}

function getCurrentUrl(env: RouteWatcherEnv): string {
  return env.location?.href ?? "";
}

function getWindowLike(): RouteWatcherEnv | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window;
}

function noop(): void {}
