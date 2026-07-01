import type { CfgManager } from "@monitor/core";
import {
  CSS_PATTERN,
  IMG_PATTERN,
  JS_PATTERN,
  getImageDomain
} from "@monitor/protocol";
import type { ResourceCallInput } from "./resource-manager";

export interface ResourceTimingEntryLike {
  name: string;
  initiatorType: string;
  startTime?: number;
  duration?: number;
  transferSize?: number;
  encodedBodySize?: number;
  decodedBodySize?: number;
}

export interface ResourceObserverEnv {
  PerformanceObserver?: new (
    callback: (list: {
      getEntries: () => ResourceTimingEntryLike[];
    }) => void
  ) => {
    observe: (options: {
      type?: string;
      entryTypes?: string[];
      buffered?: boolean;
    }) => void;
    disconnect: () => void;
  };
  performance?: {
    getEntriesByType: (type: string) => ResourceTimingEntryLike[];
  };
}

export interface ResourceObserverOptions {
  cfgManager?: CfgManager;
  /** 错误管理器引用，用于图片超标上报 (对齐 owl.js errManager._pushResource) */
  onImageExceed?: (call: ResourceCallInput) => void;
  /** 动态回退模式下的 AJAX 完成通知回调 (对齐 owl.js ajaxCall 事件) */
  onRegisterNotify?: (notify: () => void) => void;
}

const VALID_TYPES = ["link", "script", "img", "css"];
const FALLBACK_POLL_DELAY = 1500;

export function startResourceObserver(
  env: ResourceObserverEnv,
  onCall: (call: ResourceCallInput) => void,
  options: ResourceObserverOptions = {}
): () => void {
  const cfgManager = options.cfgManager;

  if (env.PerformanceObserver && !cfgManager?.getConfig("resource").disablePerformanceObserver) {
    const observer = new env.PerformanceObserver((list) => {
      try {
        for (const call of collectResourceEntries(
          list.getEntries(),
          cfgManager,
          options
        )) {
          if (call._imageExceed && options.onImageExceed) {
            options.onImageExceed(call);
          } else {
            onCall(call);
          }
        }
      } catch {
        // ignore
      }
    });
    observer.observe({ entryTypes: ["resource"] });
    return () => observer.disconnect();
  }

  // Fallback: 动态轮询模式 (对齐 owl.js entryCache + ajaxCall + 1500ms 轮询)
  if (env.performance && typeof env.performance.getEntriesByType === "function") {
    const entryCache = new Set<string>();

    // 首次读取全部已有条目
    const initialEntries = env.performance.getEntriesByType("resource");
    for (const entry of initialEntries) {
      entryCache.add(entry.name);
    }
    for (const call of collectResourceEntries(initialEntries, cfgManager, options)) {
      if (call._imageExceed && options.onImageExceed) {
        options.onImageExceed(call);
      } else {
        onCall(call);
      }
    }

    let pollTimer: ReturnType<typeof setTimeout> | undefined;

    const doPoll = () => {
      if (pollTimer) {
        clearTimeout(pollTimer);
      }
      pollTimer = setTimeout(() => {
        pollTimer = undefined;
        try {
          const allEntries = env.performance?.getEntriesByType("resource") ?? [];
          const newEntries: ResourceTimingEntryLike[] = [];
          for (const entry of allEntries) {
            if (!entryCache.has(entry.name)) {
              entryCache.add(entry.name);
              newEntries.push(entry);
            }
          }
          if (newEntries.length) {
            for (const call of collectResourceEntries(newEntries, cfgManager, options)) {
              if (call._imageExceed && options.onImageExceed) {
                options.onImageExceed(call);
              } else {
                onCall(call);
              }
            }
          }
        } catch {
          // ignore
        }
      }, FALLBACK_POLL_DELAY);
    };

    // 注册通知回调：每次 AJAX 完成后触发轮询 (对齐 owl.js Event.on('ajaxCall'))
    if (options.onRegisterNotify) {
      options.onRegisterNotify(doPoll);
    }

    return () => {
      if (pollTimer) {
        clearTimeout(pollTimer);
        pollTimer = undefined;
      }
    };
  }

  return () => undefined;
}

interface InternalResourceCall extends ResourceCallInput {
  _imageExceed?: boolean;
}

function collectResourceEntries(
  entries: ResourceTimingEntryLike[],
  cfgManager?: CfgManager,
  options: ResourceObserverOptions = {}
): InternalResourceCall[] {
  const results: InternalResourceCall[] = [];

  // 资源过滤
  const filtered = filterEntries(entries);
  if (!filtered.length) return results;

  const devMode = cfgManager?.getConfig("devMode") ?? false;
  const resReg = cfgManager?.getConfig("resource").resourceReg;

  for (const entry of filtered) {
    const url = entry.name;

    // resourceReg 过滤 (对齐 owl.js)
    if (!devMode && resReg && !resReg.test(url)) continue;

    // ignoreList.resource 过滤 (对齐 owl.js filterResource)
    if (!filterResource(url, cfgManager)) continue;

    const type = normalizeType(entry.initiatorType, url);
    const isImg = type === "image";
    const duration = Math.round(entry.duration ?? 0);

    // 图片监控 (对齐 owl.js)
    const imgConfig = cfgManager?.getConfig("image");
    if (imgConfig?.enable && isImg) {
      const filter = imgConfig.filter;
      if (!filter || filter(url)) {
        const size = entry.transferSize ?? 0;
        let secCategory: string | undefined;
        if (imgConfig.fileSize && size > imgConfig.fileSize * 1000) {
          secCategory = "IMAGE_SIZE_EXCEED";
        } else if (imgConfig.maxDuration && duration > imgConfig.maxDuration) {
          secCategory = "IMAGE_DURATION_EXCEED";
        }
        if (secCategory) {
          results.push({
            resourceUrl: url,
            type: "resourceError",
            connectType: "resource",
            statusCode: 0,
            firstCategory: "resourceError",
            secondCategory: imgConfig.fileSize ? "IMAGE_SIZE_EXCEED" : "IMAGE_DURATION_EXCEED",
            logContent: url,
            _imageExceed: true
          });
          continue;
        }
      }
    }

    results.push({
      resourceUrl: isImg ? getImageDomain(url) : url,
      type,
      connectType: getConnectType(url),
      duration,
      responsebyte:
        entry.transferSize ??
        entry.encodedBodySize ??
        entry.decodedBodySize ??
        0,
      timestamp: Math.round(entry.startTime ?? Date.now())
    });
  }

  return results;
}

/** 按 initiatorType 过滤 (对齐 owl.js filterEntries) */
function filterEntries(
  entries: ResourceTimingEntryLike[]
): ResourceTimingEntryLike[] {
  return entries.filter((e) => VALID_TYPES.includes(e.initiatorType));
}

/** ignoreList.resource 过滤 (对齐 owl.js filterResource) */
function filterResource(url: string, cfgManager?: CfgManager): boolean {
  try {
    const ignoreList =
      (cfgManager?.getConfig("resource").ignoreList as Array<string | RegExp>) ??
      [];
    for (const item of ignoreList) {
      const reg =
        typeof item === "string"
          ? new RegExp(item)
          : item;
      if (reg.test(url)) return false;
    }
    return true;
  } catch {
    return true;
  }
}

/** 类型标准化 (对齐 owl.js parseType) */
function normalizeType(initiatorType: string, url: string): string {
  if (initiatorType === "img" || IMG_PATTERN.test(url)) {
    return "image";
  }
  if (
    initiatorType === "script" ||
    (initiatorType === "link" && JS_PATTERN.test(url))
  ) {
    return "js";
  }
  if (
    initiatorType === "css" ||
    (initiatorType === "link" && CSS_PATTERN.test(url))
  ) {
    return "css";
  }
  if (initiatorType === "xmlhttprequest") {
    return "ajax";
  }
  return initiatorType;
}

function getConnectType(url: string): string {
  if (url.startsWith("https")) return "https";
  if (url.startsWith("http")) return "http";
  if (typeof document !== "undefined" && document?.location?.protocol) {
    return document.location.protocol.startsWith("https") ? "https" : "http";
  }
  return "http";
}
