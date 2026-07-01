import type { MonitorConfig, MonitorConfigPatch } from "./types";

type PlainObject = Record<string, unknown>;

export function mergeMonitorConfig(
  base: MonitorConfig,
  patch: MonitorConfigPatch = {},
): MonitorConfig {
  return mergeValue(base, normalizePatch(patch)) as MonitorConfig;
}

function normalizePatch(patch: MonitorConfigPatch): PlainObject {
  const normalized = { ...patch } as PlainObject;
  const resource = patch.resource;

  if (resource?.resourceReg !== undefined) {
    normalized.resource = {
      ...resource,
      resourceReg:
        typeof resource.resourceReg === "string"
          ? new RegExp(resource.resourceReg)
          : resource.resourceReg,
    };
  }

  return normalized;
}

function mergeValue(base: unknown, patch: unknown): unknown {
  if (patch === undefined) {
    return cloneValue(base);
  }

  if (!isMergeableObject(base) || !isMergeableObject(patch)) {
    return cloneValue(patch);
  }

  const result = cloneValue(base) as PlainObject;

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) {
      continue;
    }

    result[key] = mergeValue(result[key], value);
  }

  return result;
}

function cloneValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return [...value];
  }

  if (isMergeableObject(value)) {
    const cloned: PlainObject = {};

    for (const [key, child] of Object.entries(value)) {
      cloned[key] = cloneValue(child);
    }

    return cloned;
  }

  return value;
}

function isMergeableObject(value: unknown): value is PlainObject {
  if (value === null || typeof value !== "object") {
    return false;
  }

  if (Array.isArray(value) || value instanceof RegExp) {
    return false;
  }

  return Object.getPrototypeOf(value) === Object.prototype;
}
