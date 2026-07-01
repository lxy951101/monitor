import type { MonitorContext, Plugin } from "@monitor/core";
import { PageManager, type PageManagerOptions } from "./page-manager";
import { getPaintEntries, type NavigationTimingLike } from "./navigation-timing";

export const packageName = "@monitor/plugin-page";

export interface PagePluginOptions extends Omit<
  Partial<PageManagerOptions>,
  "send" | "cfgManager"
> {
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
        send: context.transport.send.bind(context.transport),
      });

      if (shouldReportPage(context)) {
        manager.setInitConfig({
          pageUrl: options.pageUrl,
        });
        manager.setUserReady();

        const timing = options.env?.performance?.timing ?? getRuntimeTiming();

        if (timing) {
          // 显式传入 timing 时使用旧接口上报，若在浏览器环境则同时使用增强的 parsePageTime
          void manager.reportNavigationTiming(timing).catch(() => {
            // 页面自动测速失败不应产生未处理 rejection。
          });
        }
      }
    },
    stop() {
      manager = undefined;
    },
    /** 暴露 PageManager 实例供外部调用。 */
    get manager() {
      return manager;
    },
  } as Plugin & { manager?: PageManager };
}

function shouldReportPage(context: MonitorContext): boolean {
  const config = context.cfgManager.getConfig();
  return config.autoCatch.page && config.page.enable && context.cfgManager.isSampled("page");
}

function getRuntimeTiming(): NavigationTimingLike | undefined {
  if (typeof performance === "undefined") {
    return undefined;
  }

  return (performance as unknown as { timing?: NavigationTimingLike }).timing;
}

export * from "./navigation-timing";
export * from "./page-manager";
