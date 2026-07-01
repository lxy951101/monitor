import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { parseRequestBody } from "./parser.ts";
import { RecordStore } from "./store.ts";

const DEFAULT_PORT = 8787;
const REPORT_PATHS = new Set([
 "/api/log",
 "/api/logts",
 "/api/pv",
 "/rapi/metricjts",
 "/perf/api/fsp",
 "/perf/api/ird",
 "/perf/api/shr"
]);

export interface MockServerOptions {
 port?: number;
 store?: RecordStore;
}

export function createMockServer(options: MockServerOptions = {}) {
 const store = options.store ?? new RecordStore();
 return createServer(async (request, response) => {
  await handleRequest(request, response, store);
 });
}

async function handleRequest(request: IncomingMessage, response: ServerResponse, store: RecordStore): Promise<void> {
 const url = new URL(request.url ?? "/", "http://localhost");
 setCorsHeaders(response);
 if (request.method === "OPTIONS") {
  sendJson(response, 204);
  return;
 }

 if (url.pathname === "/__records") {
  handleRecords(request, response, store);
  return;
 }

 if (!REPORT_PATHS.has(url.pathname)) {
  sendJson(response, 404, { error: "not found" });
  return;
 }

 const rawBody = await readBody(request);
 const record = store.add({
  method: request.method ?? "GET",
  path: url.pathname,
  query: Object.fromEntries(url.searchParams),
  body: parseRequestBody(url.pathname, rawBody)
 });
 sendJson(response, 200, { ok: true, id: record.id });
}

function handleRecords(request: IncomingMessage, response: ServerResponse, store: RecordStore): void {
 if (request.method === "DELETE") {
  store.clear();
  sendJson(response, 200, { ok: true });
  return;
 }

 sendJson(response, 200, store.list());
}

function readBody(request: IncomingMessage): Promise<string> {
 return new Promise((resolve, reject) => {
  const chunks: Buffer[] = [];
  request.on("data", (chunk: Buffer) => chunks.push(chunk));
  request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  request.on("error", reject);
 });
}

function setCorsHeaders(response: ServerResponse): void {
 response.setHeader("access-control-allow-origin", "*");
 response.setHeader("access-control-allow-methods", "GET,POST,DELETE,OPTIONS");
 response.setHeader("access-control-allow-headers", "content-type");
}

function sendJson(response: ServerResponse, status: number, body?: unknown): void {
 response.statusCode = status;
 response.setHeader("content-type", "application/json;charset=UTF-8");
 response.end(body === undefined ? "" : JSON.stringify(body));
}

if (import.meta.url === `file://${process.argv[1]}`) {
 const port = Number(process.env.PORT || DEFAULT_PORT);
 createMockServer().listen(port, "127.0.0.1", () => {
  console.log(`mock-server listening on http://127.0.0.1:${port}`);
 });
}
