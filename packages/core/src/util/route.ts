export interface RouteWatcherEnv {
  location: { href: string; hash?: string };
  history: {
    pushState: (data: unknown, unused: string, url?: string | URL | null) => void;
    replaceState: (data: unknown, unused: string, url?: string | URL | null) => void;
  };
  addEventListener: (name: string, listener: EventListener) => void;
  removeEventListener: (name: string, listener: EventListener) => void;
}

export type StopWatcher = () => void;
export type RouteChangeHandler = (url: string) => void;

const historyWatchers = new WeakMap<RouteWatcherEnv["history"], HistoryWatcherState>();

interface HistoryWatcherState {
  subscriptions: Set<HistorySubscription>;
  originalPushState: RouteWatcherEnv["history"]["pushState"];
  originalReplaceState: RouteWatcherEnv["history"]["replaceState"];
  onPopState: EventListener;
}

interface HistorySubscription {
  handler: RouteChangeHandler;
  onError?: (error: unknown) => void;
}

export function parseRoutePath(url: string): string {
  // 提取 pathname（兼容完整 URL 和 path-only 输入）
  let path: string;

  if (/^https?:\/\//i.test(url) || url.startsWith("//")) {
    try {
      const parsed = new URL(url, "http://_");
      path = parsed.pathname;
    } catch {
      path = url;
    }
  } else {
    path = url;
  }

  // 去除 query string
  const hashIndex = path.indexOf("#");
  const pathWithoutHash = hashIndex === -1 ? path : path.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : path.slice(hashIndex);
  const queryIndex = pathWithoutHash.indexOf("?");
  const cleanPath = queryIndex === -1 ? pathWithoutHash : pathWithoutHash.slice(0, queryIndex);

  // 保留 query 在 hash 中的场景（如 SPA 的 #/route?id=1）
  if (hash.includes("?")) {
    return `${cleanPath}${hash}`;
  }

  return cleanPath;
}

export function createHistoryRouteWatcher(
  env: RouteWatcherEnv,
  onChange: RouteChangeHandler,
  onError?: (error: unknown) => void
): StopWatcher {
  const state = ensureHistoryWatcher(env);
  const subscription = { handler: onChange, onError };
  let stopped = false;
  state.subscriptions.add(subscription);

  return () => {
    if (stopped) {
      return;
    }

    stopped = true;
    state.subscriptions.delete(subscription);

    if (state.subscriptions.size === 0 && historyWatchers.get(env.history) === state) {
      restoreHistoryWatcher(env, state);
    }
  };
}

export function createHashRouteWatcher(
  env: Pick<RouteWatcherEnv, "location" | "addEventListener" | "removeEventListener">,
  onChange: RouteChangeHandler,
  onError?: (error: unknown) => void
): StopWatcher {
  const onHashChange = () => {
    safeInvoke(onChange, env.location.href, onError);
  };

  env.addEventListener("hashchange", onHashChange);

  return () => env.removeEventListener("hashchange", onHashChange);
}

function ensureHistoryWatcher(env: RouteWatcherEnv): HistoryWatcherState {
  const existing = historyWatchers.get(env.history);

  if (existing) {
    return existing;
  }

  const state = createHistoryWatcherState(env);
  historyWatchers.set(env.history, state);
  env.addEventListener("popstate", state.onPopState);

  return state;
}

function createHistoryWatcherState(env: RouteWatcherEnv): HistoryWatcherState {
  const originalPushState = env.history.pushState.bind(env.history);
  const originalReplaceState = env.history.replaceState.bind(env.history);
  const subscriptions = new Set<HistorySubscription>();
  let lastPath = parseRoutePath(env.location.href);

  const notify = (newUrl: string) => {
    const newPath = parseRoutePath(newUrl);

    // 路径未变则不通知
    if (newPath === lastPath) {
      return;
    }

    lastPath = newPath;

    for (const subscription of [...subscriptions]) {
      safeInvoke(subscription.handler, newUrl, subscription.onError);
    }
  };

  env.history.pushState = ((...args: Parameters<RouteWatcherEnv["history"]["pushState"]>) => {
    const url = args[2];
    originalPushState(...args);
    notify(url !== undefined ? String(url) : env.location.href);
  }) as RouteWatcherEnv["history"]["pushState"];

  env.history.replaceState = ((...args: Parameters<RouteWatcherEnv["history"]["replaceState"]>) => {
    const url = args[2];
    originalReplaceState(...args);
    notify(url !== undefined ? String(url) : env.location.href);
  }) as RouteWatcherEnv["history"]["replaceState"];

  return {
    subscriptions,
    originalPushState,
    originalReplaceState,
    onPopState: () => notify(env.location.href)
  };
}

function restoreHistoryWatcher(env: RouteWatcherEnv, state: HistoryWatcherState): void {
  env.history.pushState = state.originalPushState;
  env.history.replaceState = state.originalReplaceState;
  env.removeEventListener("popstate", state.onPopState);
  historyWatchers.delete(env.history);
}

function safeInvoke(
  handler: RouteChangeHandler,
  url: string,
  onError?: (error: unknown) => void
): void {
  try {
    handler(url);
  } catch (error) {
    onError?.(error);
  }
}
