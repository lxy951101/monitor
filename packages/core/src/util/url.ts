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
  params.set(key, String(value ?? ""));

  const nextQuery = params.toString();

  return `${path}${nextQuery ? `?${nextQuery}` : ""}${hash}`;
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
