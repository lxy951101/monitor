export type PerfRunEnv = "browser" | "container";

export interface PerfMetadataRuntime {
  location?: Pick<Location, "href" | "pathname">;
  navigator?: Pick<Navigator, "userAgent" | "onLine"> & {
    connection?: { effectiveType?: string };
  };
  screen?: Pick<Screen, "width" | "height">;
  performance?: Partial<Pick<Performance, "timeOrigin">> & {
    timing?: Partial<Pick<PerformanceTiming, "navigationStart">>;
  };
  document?: {
    documentElement?: object;
  };
}

export interface PerfMetadataInput {
  project?: string;
  version?: string;
  pagePath?: string;
  sdkVersion?: string;
  runEnv?: PerfRunEnv;
  biz?: string;
  containerVersion?: string;
  visitId?: string;
  uuid?: string;
  runtime?: PerfMetadataRuntime;
}

export interface PerfMetadata extends Record<string, string | number | boolean | undefined> {
  project: string;
  version: string;
  sdkVersion: string;
  pagePath: string;
  pageUrl: string;
  pageOriginUrl: string;
  ua: string;
  userAgent: string;
  screen: string;
  visitId: string;
  runEnv: PerfRunEnv;
  biz: string;
  pageNavStart?: number;
  isOffline?: boolean;
  networkType?: string;
  uuid?: string;
  containerVersion?: string;
}

export function createPerfMetadata(input: PerfMetadataInput = {}): PerfMetadata {
  const runtime = input.runtime ?? getBrowserRuntime();
  const userAgent = runtime?.navigator?.userAgent ?? "";
  const runEnv = input.runEnv ?? "browser";
  return {
    project: input.project ?? "",
    version: input.version ?? "",
    sdkVersion: input.sdkVersion ?? "",
    pagePath: input.pagePath ?? runtime?.location?.pathname ?? "",
    pageUrl: runtime?.location?.href ?? "",
    pageOriginUrl: runtime?.location?.href ?? "",
    ua: userAgent,
    userAgent,
    screen: formatScreen(runtime?.screen),
    visitId: input.visitId ?? createVisitId(),
    runEnv,
    biz: input.biz ?? (runEnv === "container" ? "container" : "web"),
    pageNavStart: runtime?.performance?.timing?.navigationStart ?? runtime?.performance?.timeOrigin,
    isOffline: typeof runtime?.navigator?.onLine === "boolean" ? !runtime.navigator.onLine : undefined,
    networkType: runtime?.navigator?.connection?.effectiveType,
    uuid: input.uuid,
    containerVersion: input.containerVersion
  };
}

function getBrowserRuntime(): PerfMetadataRuntime | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return {
    location: window.location,
    navigator: window.navigator,
    screen: window.screen,
    performance: window.performance,
    document: window.document
  };
}

function formatScreen(screen?: Pick<Screen, "width" | "height">): string {
  if (!screen) {
    return "";
  }
  return `${screen.width}x${screen.height}`;
}

function createVisitId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
