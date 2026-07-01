import type { MonitorContext, Plugin } from "@monitor/core";
import { PageManager, type PageManagerOptions } from "./page-manager";
import type { NavigationTimingLike } from "./navigation-timing";

export const packageName = "@monitor/plugin-page";

export interface PagePluginOptions extends Omit<Partial<PageManagerOptions>, "send" | "cfgManager"> {
  env?: {
    performance?: {
      timing?: NavigationTimingLike;
    };
  };
}

export function createPagePlugin(options: PagePluginOptions = {}): Plugin {
  let manager: PageManager | undefined;

  return {
    name: packageName,
    start(context: MonitorContext) {
      manager = new PageManager({
        ...options,
        cfgManager: context.cfgManager,
        send: context.transport.send.bind(context.transport)
      });

      if (shouldReportPage(context)) {
        const timing = options.env?.performance?.timing ?? getRuntimeTiming();
        if (timing) {
          void manager.reportNavigationTiming(timing).catch(() => {
            // 页面自动测速失败不应产生未处理 rejection。
          });
        }
      }
    },
    stop() {
      manager = undefined;
    }
  };
}

function shouldReportPage(context: MonitorContext): boolean {
  const config = context.cfgManager.getConfig();
  return config.autoCatch.page && config.page.enable && context.cfgManager.isSampled("page");
}

function getRuntimeTiming(): NavigationTimingLike | undefined {
  if (typeof performance === "undefined") {
    return undefined;
  }

  return performance.timing as unknown as NavigationTimingLike | undefined;
}

export * from "./first-screen";
export * from "./fst-analysis";
export * from "./navigation-timing";
export * from "./page-manager";
export * from "./route-fst";
