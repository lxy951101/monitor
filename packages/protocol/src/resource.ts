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

/**
 * 内部实现。
 * 非 devMode 时 后端使用 protobuf 二进制格式发送到 resource_pbbatch 端点。
 */
export function encodeResourceProtobufBatch(data: ResourceBatch): Uint8Array {
 const w = new ProtobufWriter();

 // infos: repeated BatchInfo (field 1, wire type 2 → tag = 10)
 for (const info of data.infos) {
  const sub = w.fork();
  encodeBatchInfo(info, sub);
  w.uint32(10).ldelim(sub);
 }

 // batch-level option fields
 const options: [string, number][] = [
  ["region", 18],
  ["operator", 26],
  ["network", 34],
  ["container", 42],
  ["os", 50],
  ["connectType", 58],
  ["unionId", 66],
 ];
 for (const [key, tag] of options) {
  const value = (data as unknown as Record<string, string | undefined>)[key];
  if (value != null) {
   w.uint32(tag).string(value);
  }
 }

 return w.finish();
}

/**
 * 编码单条 BatchInfo，内部实现。
 * 字段顺序和 tag 值完全内部实现。
 */
function encodeBatchInfo(info: ResourceModel, w: ProtobufWriter): void {
 // field → [tag, modelKey] (logContent 在 protobuf schema 中名为 content)
 const fields: [number, string][] = [
  [10, "project"],
  [18, "pageUrl"],
  [26, "realUrl"],
  [34, "type"],
  [42, "resourceUrl"],
  [50, "connectType"],
  [58, "requestbyte"],
  [66, "responsetime"],
  [74, "responsebyte"],
  [82, "statusCode"],
  [114, "timestamp"],
  [130, "resourceType"],
  [90, "firstCategory"],
  [98, "secondCategory"],
  [106, "content"],
  [122, "traceid"],
  [138, "ctags"],
 ];

 for (const [tag, key] of fields) {
  // logContent → content 映射
  const modelKey = key === "content" ? "logContent" : key;
  const value = (info as Record<string, string | undefined>)[modelKey];
  if (value != null && value !== "") {
   w.uint32(tag).string(value);
  }
 }
}

// ─── 最小化 Protobuf Writer (仅实现 用到的 uint32 + string + fork/ldelim) ───

class ProtobufWriter {
 private chunks: Uint8Array[] = [];
 private buf: number[] = [];

 /** 写入 varint tag */
 uint32(value: number): this {
  writeVarint(value, this.buf);
  return this;
 }

 /** 写入 length-delimited string */
 string(value: string): this {
  const bytes = new TextEncoder().encode(value);
  writeVarint(bytes.byteLength, this.buf);
  this.flushBuf();
  this.chunks.push(bytes);
  return this;
 }

 /** 开始 nested message 写入 */
 fork(): ProtobufWriter {
  this.flushBuf();
  return new ProtobufWriter();
 }

 /** 结束 nested message，写入为 length-delimited 字段 */
 ldelim(sub: ProtobufWriter): this {
  const subBytes = sub.finish();
  writeVarint(subBytes.byteLength, this.buf);
  this.flushBuf();
  this.chunks.push(subBytes);
  return this;
 }

 /** 完成编码，返回合并后的 Uint8Array */
 finish(): Uint8Array {
  this.flushBuf();
  const totalLen = this.chunks.reduce((acc, c) => acc + c.byteLength, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of this.chunks) {
   result.set(chunk, offset);
   offset += chunk.byteLength;
  }
  return result;
 }

 private flushBuf(): void {
  if (this.buf.length > 0) {
   this.chunks.push(new Uint8Array(this.buf));
   this.buf = [];
  }
 }
}

function writeVarint(value: number, buf: number[]): void {
 // eslint-disable-next-line no-constant-condition
 while (true) {
  let bits = value & 0x7f;
  value >>>= 7;
  if (value) {
   buf.push(bits | 0x80);
  } else {
   buf.push(bits);
   break;
  }
 }
}

/** 图片资源识别正则 */
export const IMG_PATTERN = /\.(png|jpe?g|gif|svg|webp|ico|bmp|tiff)(\?.*)?$/i;

/** JS 资源识别正则 */
export const JS_PATTERN = /\.js(\?.*)?$/i;

/** CSS 资源识别正则 */
export const CSS_PATTERN = /\.css(\?.*)?$/i;

/**
 * 截取图片域名路径 
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
