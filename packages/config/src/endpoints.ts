export const SDK_VERSION = "0.0.0";

export const REPORT_BASE_URLS = {
  production: "https://catfront.dianping.com",
  development: "https://catfront.51ping.com"
} as const;

export const API_PATHS = {
  log: "/api/log",
  logTs: "/api/logts",
  speedTs: "/api/speedts",
  pbBatchTs: "/pbbatchts",
  batchTs: "/batchts",
  metricJTs: "/rapi/metricjts",
  pvTs: "/api/pvts",
  fstSpeed: "/raptorapi/fstSpeed",
  fstLog: "/raptorapi/fstLog"
} as const;

export const HORN_URL = "https://portal-portm.meituan.com/horn?";

export const LOGAN_CDN_PREFIXES = [
  "//www.dpfile.com/app/dp-logan-web/logan_",
  "//s3.meituan.net/v1/mss_eb9ea9cfff9840198c3ae909b17b4270/production/logan-websdk/logan_"
] as const;

export const PERF_DEFAULT_ENDPOINTS = {
  fsp2: "/perf/api/fsp2",
  ird: "/perf/api/ird",
  shr: "/perf/api/shr"
} as const;

export function getReportBaseUrl(devMode: boolean): string {
  return devMode ? REPORT_BASE_URLS.development : REPORT_BASE_URLS.production;
}
