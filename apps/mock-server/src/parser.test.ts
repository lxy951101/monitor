import { describe, expect, it } from "vitest";
import { parseLogtsBody, parseRequestBody } from "./parser.ts";
import { RecordStore, type MockRecord } from "./store.ts";

describe("mock-server 解析器", () => {
 it("解析 /api/logts 的 c= 请求体", () => {
  const payload = [{ project: "demo", sec_category: "boom" }];
  const body = "c=" + encodeURIComponent(JSON.stringify(payload));

  expect(parseLogtsBody(body)).toEqual(payload);
 });

 it("解析 JSON 请求体，无法解析时保留原始文本", () => {
  expect(parseRequestBody("/rapi/metricjts", "{\"ok\":true}")).toEqual({ ok: true });
  expect(parseRequestBody("/rapi/metricjts", "raw")).toBe("raw");
 });
});

describe("RecordStore", () => {
 it("最多保留最近 maxLength 条记录", () => {
  const store = new RecordStore(2);
  store.add({ method: "POST", path: "/a", query: {}, body: 1 });
  store.add({ method: "POST", path: "/b", query: {}, body: 2 });
  store.add({ method: "POST", path: "/c", query: {}, body: 3 });

  expect(store.list().map((record: MockRecord) => record.path)).toEqual(["/b", "/c"]);
  store.clear();
  expect(store.list()).toEqual([]);
 });
});
