import type { MonitorContext, Plugin } from "@monitor/core";
import { createAjaxInterceptor, type AjaxCall, type AjaxInterceptor } from "./ajax";
import { createFetchInterceptor, type FetchCall, type FetchInterceptor } from "./fetch";
import { startResourceErrorCapture, type ResourceErrorTarget } from "./resource-error";
import { ResourceManager, type ResourceCallInput, type ResourceManagerOptions } from "./resource-manager";
import { startResourceObserver, type ResourceObserverEnv } from "./resource-observer";

export const packageName = "@monitor/plugin-resource";

export interface ResourcePluginOptions extends Omit<Partial<ResourceManagerOptions>, "send" | "cfgManager"> {
  window?: ResourcePluginWindow;
}

interface ResourcePluginWindow {
  XMLHttpRequest?: new () => XMLHttpRequest;
  fetch?: typeof fetch;
  PerformanceObserver?: ResourceObserverEnv["PerformanceObserver"];
  performance?: ResourceObserverEnv["performance"];
  addEventListener?: ResourceErrorTarget["addEventListener"];
  removeEventListener?: ResourceErrorTarget["removeEventListener"];
}

export function createResourcePlugin(options: ResourcePluginOptions = {}): Plugin {
  let manager: ResourceManager | undefined;
  let ajax: AjaxInterceptor | undefined;
  let fetchInterceptor: FetchInterceptor | undefined;
  let stopObserver: (() => void) | undefined;
  let stopErrorCapture: (() => void) | undefined;

  return {
    name: packageName,
    start(context: MonitorContext) {
      const targetWindow = options.window ?? getRuntimeWindow();
      manager = new ResourceManager({
        ...options,
        cfgManager: context.cfgManager,
        send: context.transport.send.bind(context.transport)
      });

      if (targetWindow?.XMLHttpRequest) {
        ajax = createAjaxInterceptor({
          window: targetWindow as { XMLHttpRequest: new () => XMLHttpRequest },
          onCall: (call) => reportSafely(manager, toResourceCall(call)),
          shouldIgnore: (url) => manager?.isReportUrl(url) ?? false
        });
        ajax.start();
      }

      if (targetWindow?.fetch) {
        fetchInterceptor = createFetchInterceptor({
          window: targetWindow as { fetch: typeof fetch },
          onCall: (call) => reportSafely(manager, toResourceCall(call)),
          shouldIgnore: (url) => manager?.isReportUrl(url) ?? false
        });
        fetchInterceptor.start();
      }

      stopObserver = startResourceObserver(targetWindow ?? {}, (call) => reportSafely(manager, call));

      if (targetWindow?.addEventListener && targetWindow.removeEventListener) {
        stopErrorCapture = startResourceErrorCapture(targetWindow as ResourceErrorTarget, (call) => {
          reportSafely(manager, call);
        });
      }
    },
    stop() {
      ajax?.stop();
      fetchInterceptor?.stop();
      stopObserver?.();
      stopErrorCapture?.();
      ajax = undefined;
      fetchInterceptor = undefined;
      stopObserver = undefined;
      stopErrorCapture = undefined;
      manager = undefined;
    }
  };
}

function toResourceCall(call: AjaxCall | FetchCall): ResourceCallInput {
  return {
    ...call,
    resourceUrl: call.url,
    connectType: call.type
  };
}

function reportSafely(manager: ResourceManager | undefined, call: ResourceCallInput): void {
  void manager?.reportCall(call).catch(() => {
    // 资源/API 自动采集失败不应产生未处理 rejection。
  });
}

function getRuntimeWindow(): ResourcePluginWindow | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window as unknown as ResourcePluginWindow;
}

export * from "./ajax";
export * from "./fetch";
export * from "./resource-error";
export * from "./resource-manager";
export * from "./resource-observer";
