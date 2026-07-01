export type QueryValue = string | number | boolean | null | undefined;

export function stringifyQuery(query: Record<string, unknown>): string {
  return Object.entries(query)
    .filter((entry): entry is [string, QueryValue] => isQueryValue(entry[1]))
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value ?? ""))}`)
    .join("&");
}

export function replaceParam(url: string, key: string, value: QueryValue): string {
  const { path, query, hash } = splitUrl(url);
  const params = new URLSearchParams(query);

  if (value === undefined) {
    params.delete(key);
  } else {
    params.set(key, String(value ?? ""));
  }

  const nextQuery = params.toString();

  return `${path}${nextQuery ? `?${nextQuery}` : ""}${hash}`;
}

export function getFullUrl(url: string, base?: string): string {
  // 已是绝对路径
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  // 协议相对路径 (//example.com/path)
  if (url.startsWith("//")) {
    const proto = typeof location !== "undefined" ? location.protocol : "https:";

    return proto + url;
  }

  // 路径相对路径 (/path)
  if (url.startsWith("/")) {
    const origin = base ?? (typeof location !== "undefined" ? location.origin : "");

    if (origin) {
      return origin + url;
    }

    return url;
  }

  return url;
}

export function checkSameOrigin(url: string, origin?: string): boolean {
  try {
    const base = origin ?? (typeof location !== "undefined" ? location.origin : "");

    if (!base) {
      return true; // 无法判断时假定同源
    }

    const parsed = new URL(url, base);
    const baseParsed = new URL(base);

    return parsed.hostname === baseParsed.hostname && parsed.protocol === baseParsed.protocol;
  } catch {
    return false;
  }
}

function isQueryValue(value: unknown): value is QueryValue {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function splitUrl(url: string): { path: string; query: string; hash: string } {
  const hashIndex = url.indexOf("#");
  const urlWithoutHash = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : url.slice(hashIndex);
  const queryIndex = urlWithoutHash.indexOf("?");

  if (queryIndex === -1) {
    return { path: urlWithoutHash, query: "", hash };
  }

  return {
    path: urlWithoutHash.slice(0, queryIndex),
    query: urlWithoutHash.slice(queryIndex + 1),
    hash
  };
}
