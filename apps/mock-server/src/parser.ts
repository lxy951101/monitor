export type ParsedBody = unknown;

export function parseLogtsBody(body: string): ParsedBody[] {
  const params = new URLSearchParams(body);
  const value = params.get("c");
  if (!value) {
    return [];
  }

  const parsed: unknown = JSON.parse(value);
  return Array.isArray(parsed) ? parsed : [parsed];
}

export function parseJsonBody(body: string): ParsedBody {
  if (!body) {
    return undefined;
  }

  return JSON.parse(body);
}

export function parseRequestBody(pathname: string, body: string): ParsedBody {
  if (pathname === "/api/log" || pathname === "/api/logts") {
    return parseLogtsBody(body);
  }

  try {
    return parseJsonBody(body);
  } catch {
    return body;
  }
}
