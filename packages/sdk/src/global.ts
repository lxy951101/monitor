import type { CoreConfigPatch } from "@monitor/core";
import type { MonitorClient } from "./monitor-client";
import { createMonitorNamespace, type MonitorNamespace } from "./index";

type QueueItem = [string, ...unknown[]] | ((monitor: MonitorNamespace) => void);

export interface MonitorGlobalTarget {
  Monitor?: MonitorNamespace;
  monitor?: QueueItem[] | ((method: string, ...args: unknown[]) => unknown);
  _Monitor_?: QueueItem[];
  Owl?: MonitorNamespace;
  owl?: MonitorNamespace;
}

export interface InstallGlobalOptions {
  target?: MonitorGlobalTarget;
  config?: CoreConfigPatch;
  client?: MonitorClient;
}

export function installGlobal(options: InstallGlobalOptions = {}): MonitorNamespace | undefined {
  const target = options.target ?? getRuntimeTarget();
  if (!target) {
    return undefined;
  }

  const existingQueue = Array.isArray(target.monitor) ? target.monitor : [];
  const monitor = createMonitorNamespace(options.client);
  target.Monitor = monitor;
  target.monitor = (method: string, ...args: unknown[]) => invokeQueued(monitor, method, args);
  replayQueue(monitor, existingQueue);
  replayQueue(monitor, target._Monitor_);

  if (options.config?.compat?.legacyOwlAlias) {
    target.Owl = monitor;
    target.owl = monitor;
  }
  return monitor;
}

function replayQueue(monitor: MonitorNamespace, queue: QueueItem[] | undefined): void {
  for (const item of queue ?? []) {
    if (typeof item === "function") {
      item(monitor);
    } else {
      invokeQueued(monitor, item[0], item.slice(1));
    }
  }
}

function invokeQueued(monitor: MonitorNamespace, method: string, args: unknown[]): unknown {
  const fn = (monitor as unknown as Record<string, unknown>)[method];
  return typeof fn === "function" ? fn.apply(monitor, args) : undefined;
}

function getRuntimeTarget(): MonitorGlobalTarget | undefined {
  return typeof window === "undefined" ? undefined : window as unknown as MonitorGlobalTarget;
}
