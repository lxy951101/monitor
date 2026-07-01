import { encodeQueryParams, type QueryParams, type QueryValue } from "@monitor/protocol";

export type UrlQuery = Record<string, QueryValue>;

export interface PageUrlEnv {
  location?: {
    href?: string;
  };
}

export function stringifyQuery(query: UrlQuery): string {
  return encodeQueryParams(query);
}

export function replaceParam(url: string, key: string, value: QueryValue): string {
  const [withoutHash, hash] = splitHash(url);
  const [path, query = ""] = withoutHash.split("?", 2);
  const params = new URLSearchParams(query);

  if (value === undefined || value === null) {
    params.delete(key);
  } else {
    params.set(key, String(value));
  }

  const nextQuery = params.toString();
  return `${path}${nextQuery ? `?${nextQuery}` : ""}${hash}`;
}

export function getPageUrl(env?: PageUrlEnv): string {
  const target = env ?? getWindowLike();
  return target?.location?.href ?? "";
}

function splitHash(url: string): [string, string] {
  const hashIndex = url.indexOf("#");

  if (hashIndex === -1) {
    return [url, ""];
  }

  return [url.slice(0, hashIndex), url.slice(hashIndex)];
}

function getWindowLike(): PageUrlEnv | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window;
}
