import {
  createHashRouteWatcher,
  createHistoryRouteWatcher,
  type RouteWatcherEnv,
  type StopWatcher
} from "@monitor/core";

export interface RouteFstOptions {
  env?: RouteWatcherEnv;
  routeMode?: "history" | "hash" | "auto";
  onRoute: (url: string) => void;
}

export function startRouteFst(options: RouteFstOptions): StopWatcher {
  const env = options.env ?? getRuntimeRouteEnv();
  if (!env) {
    return () => undefined;
  }

  if (options.routeMode === "hash") {
    return createHashRouteWatcher(env, options.onRoute);
  }

  if (options.routeMode === "auto") {
    const stopHistory = createHistoryRouteWatcher(env, options.onRoute);
    const stopHash = createHashRouteWatcher(env, options.onRoute);
    return () => {
      stopHistory();
      stopHash();
    };
  }

  return createHistoryRouteWatcher(env, options.onRoute);
}

function getRuntimeRouteEnv(): RouteWatcherEnv | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window;
}

