import { getPageUrl, type MonitorContext, type Plugin } from "@monitor/core";
import { createErrorCapture, type ErrorCapture } from "./capture";
import { ErrorManager, type ErrorManagerOptions } from "./error-manager";

export interface ErrorPluginOptions extends Omit<
  Partial<ErrorManagerOptions>,
  "send" | "cfgManager"
> {
  onReady?: (manager: ErrorManager) => void;
}

export function createErrorPlugin(options: ErrorPluginOptions = {}): Plugin {
  let manager: ErrorManager | undefined;
  let capture: ErrorCapture | undefined;

  return {
    name: "@monitor/plugin-error",
    start(context: MonitorContext) {
      const config = context.cfgManager.getConfig();

      manager = new ErrorManager({
        ...options,
        cfgManager: context.cfgManager,
        send: context.transport.send.bind(context.transport),
        pageUrl: options.pageUrl ?? getPageUrl(),
        maxNum: options.maxNum ?? config.error.maxQueueLength,
        maxTime: options.maxTime ?? config.error.maxTime,
        delay: options.delay ?? config.error.delay,
        maxSize: options.maxSize ?? config.error.maxSize,
        noScriptError: options.noScriptError ?? config.error.noScriptError,
        formatUnhandledRejection:
          options.formatUnhandledRejection ?? config.error.formatUnhandledRejection,
        ignoreList: options.ignoreList ?? config.error.ignoreList,
      });
      options.onReady?.(manager);

      manager.checkCache();

      manager.detectLeave();

      if (config.autoCatch.js || config.autoCatch.unhandledrejection || config.autoCatch.console) {
        capture = createErrorCapture({
          addError: manager.addError.bind(manager),
          onWindowError: manager.parseWindowError.bind(manager),
          onUnhandledRejection: manager.parsePromiseUnhandled.bind(manager),
          onConsoleError: manager.parseConsoleError.bind(manager),
          captureConsoleError: config.autoCatch.console,
        });
        capture.start();
      }
    },
    stop() {
      capture?.stop();
      capture = undefined;
      manager = undefined;
    },
  };
}
