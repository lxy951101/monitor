import type { MonitorContext, Plugin } from "@monitor/core";
import {
  createAjaxInterceptor,
  type AjaxCall,
  type AjaxInterceptor
} from "./ajax";
import {
  createFetchInterceptor,
  type FetchCall,
  type FetchInterceptor
} from "./fetch";
import {
  startResourceErrorCapture,
  type ResourceErrorTarget,
  type ResourceErrorOptions
} from "./resource-error";
import {
  ResourceManager,
  type ResourceCallInput,
  type ResourceManagerOptions
} from "./resource-manager";
import {
  startResourceObserver,
  type ResourceObserverEnv
} from "./resource-observer";

export const packageName = "@monitor/plugin-resource";

export interface ResourcePluginOptions
  extends Omit<Partial<ResourceManagerOptions>, "send" | "cfgManager"> {
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

export function createResourcePlugin(
  options: ResourcePluginOptions = {}
): Plugin {
  let manager: ResourceManager | undefined;
  let ajax: AjaxInterceptor | undefined;
  let fetchInterceptor: FetchInterceptor | undefined;
  let stopObserver: (() => void) | undefined;
  let stopErrorCapture: (() => void) | undefined;

  return {
    name: packageName,
    start(context: MonitorContext) {
      const targetWindow = options.window ?? getRuntimeWindow();
      const config = context.cfgManager.getConfig();
      const resCfg = config.resource;
      const ajaxCfg = config.ajax;

      manager = new ResourceManager({
        ...options,
        cfgManager: context.cfgManager,
        send: context.transport.send.bind(context.transport)
      });

      // 动态回退轮询通知 (对齐 owl.js ajaxCall → 1500ms 轮询 entry diff)
      let notifyAjaxComplete: (() => void) | undefined;

      if (targetWindow?.XMLHttpRequest && config.autoCatch.ajax && ajaxCfg.withXHR) {
        ajax = createAjaxInterceptor({
          window: targetWindow as {
            XMLHttpRequest: new () => XMLHttpRequest;
          },
          onCall: (call) => {
            const input = toResourceCall(call);
            manager?.pushApi(input);
            notifyAjaxComplete?.();
          },
          shouldIgnore: (url) => manager?.isReportUrl(url) ?? false,
          catchAbort: resCfg.catchAbort,
          catchTimeout: resCfg.catchTimeout,
          enableLogTrace: ajaxCfg.enableLogTrace ?? false,
          project: config.project,
          enableStatusCheck: resCfg.enableStatusCheck,
          autoBusinessCode: ajaxCfg.autoBusinessCode,
          parseResponse: ajaxCfg.parseResponse
        });
        ajax.start();
      }

      if (targetWindow?.fetch && config.autoCatch.ajax && ajaxCfg.withFetch) {
        fetchInterceptor = createFetchInterceptor({
          window: targetWindow as { fetch: typeof fetch },
          onCall: (call) => {
            const input = toResourceCall(call);
            manager?.pushApi(input);
            notifyAjaxComplete?.();
          },
          shouldIgnore: (url) => manager?.isReportUrl(url) ?? false,
          enableLogTrace: ajaxCfg.enableLogTrace ?? false,
          project: config.project,
          autoBusinessCode: ajaxCfg.autoBusinessCode,
          parseResponse: ajaxCfg.parseResponse,
          ignoreMTSIForbid: resCfg.ignoreMTSIForbidRequest
        });
        fetchInterceptor.start();
      }

      // 静态资源监控
      const observerEnv: ResourceObserverEnv = targetWindow ?? {};
      const observerOptions = {
        cfgManager: context.cfgManager,
        onImageExceed: (call: ResourceCallInput) => {
          // 图片超标走 pushCall (resource 采样)
          manager?.pushCall(call);
        },
        // 动态回退模式下，每次 AJAX 完成触发 1500ms 轮询 (对齐 owl.js)
        onRegisterNotify: (notify: () => void) => {
          notifyAjaxComplete = notify;
        }
      };
      stopObserver = startResourceObserver(
        observerEnv,
        (call) => manager?.pushCall(call),
        observerOptions
      );

      // 静态资源错误捕获
      if (
        targetWindow?.addEventListener &&
        targetWindow.removeEventListener &&
        config.autoCatch.resource
      ) {
        const errorOptions: ResourceErrorOptions = {
          cfgManager: context.cfgManager
        };
        stopErrorCapture = startResourceErrorCapture(
          targetWindow as ResourceErrorTarget,
          (call) => manager?.pushCall(call),
          errorOptions
        );
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
    resourceUrl: call.url,
    type: call.type as "ajax" | "fetch",
    connectType: call.type,
    duration: call.duration,
    requestbyte: call.requestbyte,
    responsebyte: call.responsebyte,
    statusCode:
      typeof call.statusCode === "string"
        ? parseInt(call.statusCode, 10) || 0
        : call.statusCode,
    firstCategory: call.firstCategory,
    logContent: call.logContent
  };
}

function getRuntimeWindow(): ResourcePluginWindow | undefined {
  if (typeof window === "undefined") return undefined;
  return window as unknown as ResourcePluginWindow;
}

export * from "./ajax";
export * from "./fetch";
export * from "./resource-error";
export * from "./resource-manager";
export * from "./resource-observer";
