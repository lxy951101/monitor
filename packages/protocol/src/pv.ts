import { encodeQueryParams } from "./query";

export interface PvModel {
 project: string;
 pageurl: string;
 pageId: string;
 timestamp: number;
 region: string;
 operator: string;
 network: string;
 container: string;
 os: string;
 unionid: string;
 ctags: string;
}

export interface CreatePvModelInput {
 project: string;
 pageurl: string;
 pageId?: string;
 timestamp?: number;
 region?: string;
 operator?: string;
 network?: string;
 container?: string;
 os?: string;
 unionid?: string;
 ctags?: string | Record<string, string>;
}

export function createPvModel(input: CreatePvModelInput): PvModel {
 return {
  project: input.project,
  pageurl: input.pageurl,
  pageId: input.pageId ?? "",
  timestamp: input.timestamp ?? Date.now(),
  region: input.region ?? "",
  operator: input.operator ?? "",
  network: input.network ?? "",
  container: input.container ?? "",
  os: input.os ?? "",
  unionid: input.unionid ?? "",
  ctags: formatCtags(input.ctags)
 };
}

export function encodePvQuery(model: PvModel): string {
 return encodeQueryParams({ ...model });
}

function formatCtags(value: string | Record<string, string> | undefined): string {
 if (value === undefined) {
  return "";
 }
 return typeof value === "string" ? value : JSON.stringify(value);
}
