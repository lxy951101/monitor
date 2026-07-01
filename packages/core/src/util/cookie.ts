export interface CookieOptions {
  path?: string;
  domain?: string;
  expires?: Date;
  maxAge?: number;
  sameSite?: "Strict" | "Lax" | "None";
  secure?: boolean;
}

export interface CookieDocument {
  cookie: string;
}

export function getCookie(name: string, cookieString?: string): string | undefined {
  const source = cookieString ?? getDocumentCookie();

  if (!source) {
    return undefined;
  }

  const encodedName = encodeURIComponent(name);
  const cookies = source.split(";").map((cookie) => cookie.trim());

  for (const cookie of cookies) {
    const separatorIndex = cookie.indexOf("=");
    const key = separatorIndex === -1 ? cookie : cookie.slice(0, separatorIndex);

    if (key === encodedName || key === name) {
      const rawValue = separatorIndex === -1 ? "" : cookie.slice(separatorIndex + 1);
      return safeDecode(rawValue);
    }
  }

  return undefined;
}

export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
  doc?: CookieDocument
): string {
  const cookie = buildCookie(name, value, options);
  const target = doc ?? getDocumentLike();

  if (target) {
    target.cookie = cookie;
  }

  return cookie;
}

function buildCookie(name: string, value: string, options: CookieOptions): string {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  }

  if (options.expires) {
    parts.push(`Expires=${options.expires.toUTCString()}`);
  }

  if (options.domain) {
    parts.push(`Domain=${options.domain}`);
  }

  if (options.path) {
    parts.push(`Path=${options.path}`);
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }

  if (options.secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getDocumentCookie(): string | undefined {
  return getDocumentLike()?.cookie;
}

function getDocumentLike(): CookieDocument | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }

  return document;
}
