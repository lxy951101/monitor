import { CfgManager, getPageUrl, type CoreConfigPatch } from "@monitor/core";
import { createCustomSpeedModel, encodeCustomSpeed } from "@monitor/protocol";
import type { TransportRequest, TransportResponse } from "@monitor/transport";
import { calculateFirstScreen, type FirstScreenNode } from "./first-screen";
import { encodePageSpeedFromTiming, type NavigationTimingLike } from "./navigation-timing";

type SendFn = (request: TransportRequest) => Promise<TransportResponse | void>;

export interface PageManagerOptions extends CoreConfigPatch {
  send: SendFn;
  cfgManager?: CfgManager;
  pageUrl?: string;
  realUrl?: string;
}

export class PageManager {
  private readonly cfgManager: CfgManager;
  private readonly send: SendFn;
  private readonly options: PageManagerOptions;

  constructor(options: PageManagerOptions) {
    this.options = options;
    this.send = options.send;
    this.cfgManager = options.cfgManager ?? new CfgManager(options);
  }

  reportNavigationTiming(timing: NavigationTimingLike): Promise<void> {
    const points = encodePageSpeedFromTiming(timing).split("|").map(Number);
    return this.reportCustomSpeed(points);
  }

  reportFirstScreen(nodes: FirstScreenNode[], viewportHeight: number): Promise<void> {
    const result = calculateFirstScreen(nodes, viewportHeight);
    return this.reportCustomSpeed([result.time, result.score]);
  }

  async reportCustomSpeed(points: number[]): Promise<void> {
    await this.send({
      method: "POST",
      url: this.cfgManager.getApiPath("speedTs"),
      body: encodeCustomSpeed(
        createCustomSpeedModel({
          project: this.cfgManager.getConfig("project"),
          pageUrl: this.options.pageUrl ?? getPageUrl(),
          realUrl: this.options.realUrl ?? this.options.pageUrl ?? getPageUrl(),
          points
        })
      ),
      headers: {
        "content-type": "text/plain;charset=UTF-8"
      }
    });
  }
}

