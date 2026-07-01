import {
  createHashRouteWatcher,
  createHistoryRouteWatcher,
  type RouteWatcherEnv,
  type StopWatcher
} from "@monitor/core";
import type { PvManager } from "./pv-manager";

export type WatchRoute = (onChange: (url: string) => void) => StopWatcher;

export interface SpaPvOptions {
  watchRoute?: WatchRoute;
  env?: RouteWatcherEnv;
  routeMode?: "history" | "hash" | "auto";
}

export function startSpaPv(manager: PvManager, options: SpaPvOptions = {}): StopWatcher {
  let stopped = false;
  const stopWatcher = createWatcher(options)((url) => {
    if (stopped) {
      return;
    }

    manager.resetPv({ pageUrl: url });
    void manager.report({ delay: true }).catch(() => {
      // SPA 自动 PV 的后台发送失败不应产生未处理 rejection。
    });
  });

  return () => {
    if (stopped) {
      return;
    }

    stopped = true;
    stopWatcher();
  };
}

function createWatcher(options: SpaPvOptions): WatchRoute {
  if (options.watchRoute) {
    return options.watchRoute;
  }

  return (onChange) => {
    const env = options.env ?? getRuntimeRouteEnv();
    if (!env) {
      return () => undefined;
    }

    if (options.routeMode === "hash") {
      return createHashRouteWatcher(env, onChange);
    }

    if (options.routeMode === "auto") {
      return startAutoWatcher(env, onChange);
    }

    return createHistoryRouteWatcher(env, onChange);
  };
}

function startAutoWatcher(env: RouteWatcherEnv, onChange: (url: string) => void): StopWatcher {
  const stopHistory = createHistoryRouteWatcher(env, onChange);
  const stopHash = createHashRouteWatcher(env, onChange);

  return () => {
    stopHistory();
    stopHash();
  };
}

function getRuntimeRouteEnv(): RouteWatcherEnv | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window;
}
