export const RESOURCE_FIELD_ORDER = [
  "resourceUrl",
  "connectType",
  "type",
  "timestamp",
  "requestbyte",
  "responsebyte",
  "responsetime",
  "project",
  "pageUrl",
  "realUrl",
  "statusCode",
  "firstCategory",
  "secondCategory",
  "logContent",
  "traceid",
  "ctags"
] as const;

export type ResourceFieldName = (typeof RESOURCE_FIELD_ORDER)[number];

export type ResourceModel = Record<ResourceFieldName, string>;

export interface CreateResourceModelInput {
  resourceUrl: string;
  connectType: string;
  type: string;
  timestamp?: string | number;
  requestbyte?: string | number;
  responsebyte?: string | number;
  responsetime?: string | number;
  project: string;
  pageUrl: string;
  realUrl: string;
  statusCode?: string | number;
  firstCategory?: string;
  secondCategory?: string;
  logContent?: string;
  traceid?: string;
  ctags?: string | Record<string, string>;
}

export interface ResourceBatch {
  infos: ResourceModel[];
  region?: string;
  operator?: string;
  network?: string;
  container?: string;
  os?: string;
  unionId?: string;
}

export function createResourceModel(input: CreateResourceModelInput): ResourceModel {
  return {
    resourceUrl: toText(input.resourceUrl),
    connectType: toText(input.connectType),
    type: toText(input.type),
    timestamp: toText(input.timestamp ?? Date.now()),
    requestbyte: toText(input.requestbyte ?? "0"),
    responsebyte: toText(input.responsebyte ?? "0"),
    responsetime: toText(input.responsetime),
    project: toText(input.project),
    pageUrl: toText(input.pageUrl),
    realUrl: toText(input.realUrl),
    statusCode: toText(input.statusCode),
    firstCategory: toText(input.firstCategory),
    secondCategory: toText(input.secondCategory),
    logContent: toText(input.logContent),
    traceid: toText(input.traceid),
    ctags: formatTags(input.ctags)
  };
}

export function encodeResourceTextBatch(data: ResourceBatch): string {
  return JSON.stringify(data);
}

export function encodeResourceJsonBatchBytes(data: ResourceBatch): Uint8Array {
  return new TextEncoder().encode(encodeResourceTextBatch(data));
}

export function encodeResourceProtobufBatch(_data: ResourceBatch): Uint8Array {
  throw new Error("resource protobuf encoding is not implemented yet");
}

/** 图片资源识别正则 (对齐 owl.js imgPattern) */
export const IMG_PATTERN = /\.(png|jpe?g|gif|svg|webp|ico|bmp)(\?.*)?$/i;

/** JS 资源识别正则 */
export const JS_PATTERN = /\.js(\?.*)?$/i;

/** CSS 资源识别正则 */
export const CSS_PATTERN = /\.css(\?.*)?$/i;

/**
 * 截取图片域名路径 (对齐 owl.js getImageDomain)
 * 例: https://cdn.example.com/a/b/c.png → https://cdn.example.com/images
 */
export function getImageDomain(url: string): string {
  const arr = url.split("//");
  if (arr.length > 1) {
    return arr[0] + "//" + arr[1].split("/")[0] + "/images";
  }
  return url;
}

function formatTags(value: string | Record<string, string> | undefined): string {
  if (value === undefined) {
    return "";
  }
  return typeof value === "string" ? value : JSON.stringify(value);
}

function toText(value: string | number | undefined): string {
  return value === undefined ? "" : String(value);
}
