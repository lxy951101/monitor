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
}

export function createHistoryRouteWatcher(
  env: RouteWatcherEnv,
  onChange: RouteChangeHandler
): StopWatcher {
  const state = ensureHistoryWatcher(env);
  const subscription = { handler: onChange };
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
  onChange: RouteChangeHandler
): StopWatcher {
  const onHashChange = () => onChange(env.location.href);

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
  const notify = () => {
    for (const subscription of [...subscriptions]) {
      subscription.handler(env.location.href);
    }
  };

  env.history.pushState = ((...args: Parameters<RouteWatcherEnv["history"]["pushState"]>) => {
    originalPushState(...args);
    notify();
  }) as RouteWatcherEnv["history"]["pushState"];
  env.history.replaceState = ((...args: Parameters<RouteWatcherEnv["history"]["replaceState"]>) => {
    originalReplaceState(...args);
    notify();
  }) as RouteWatcherEnv["history"]["replaceState"];

  return {
    subscriptions,
    originalPushState,
    originalReplaceState,
    onPopState: notify
  };
}

function restoreHistoryWatcher(env: RouteWatcherEnv, state: HistoryWatcherState): void {
  env.history.pushState = state.originalPushState;
  env.history.replaceState = state.originalReplaceState;
  env.removeEventListener("popstate", state.onPopState);
  historyWatchers.delete(env.history);
}
