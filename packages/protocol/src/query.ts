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
  const [baseUrl, fragment] = splitFragment(url);
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}${query}${fragment}`;
}

function splitFragment(url: string): [string, string] {
  const hashIndex = url.indexOf("#");
  if (hashIndex === -1) {
    return [url, ""];
  }
  return [url.slice(0, hashIndex), url.slice(hashIndex)];
}
