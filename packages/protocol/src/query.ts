export type QueryValue = string | number | boolean | null | undefined;

export type QueryParams = Record<string, QueryValue>;

export function encodeQueryParams(params: QueryParams): string {
  return Object.entries(params)
    .filter((entry): entry is [string, Exclude<QueryValue, undefined>] => entry[1] !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value ?? ""))}`)
    .join("&");
}

export function appendQueryParams(url: string, params: QueryParams): string {
  const query = encodeQueryParams(params);
  if (!query) {
    return url;
  }
  return `${url}${url.includes("?") ? "&" : "?"}${query}`;
}
