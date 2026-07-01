export interface GetCookieOptions {
 /** 自定义 cookie 字符串（用于测试/SSR），默认读取 document.cookie */
 cookie?: string;
 /** 是否返回原始值（跳过 decodeURIComponent），默认 false */
 raw?: boolean;
}

export function getCookie(name: string, options: GetCookieOptions = {}): string | undefined {
 const source = options.cookie ?? getRuntimeCookie();

 for (const part of source.split(";")) {
  const [rawKey, ...rawValue] = part.trim().split("=");

  if (rawKey === name) {
   const raw = rawValue.join("=");

   return options.raw ? raw : decodeURIComponent(raw);
  }
 }

 return undefined;
}

export interface SetCookieOptions {
 document?: Pick<Document, "cookie">;
 path?: string;
 domain?: string;
 maxAge?: number;
 expires?: Date;
 sameSite?: "Strict" | "Lax" | "None";
 secure?: boolean;
}

export function setCookie(name: string, value: string, options: SetCookieOptions = {}): void {
 const target = options.document ?? getRuntimeDocument();

 if (!target) {
  return;
 }

 target.cookie = buildCookie(name, value, options);
}

function getRuntimeCookie(): string {
 if (typeof document === "undefined") {
  return "";
 }

 return document.cookie;
}

function getRuntimeDocument(): Pick<Document, "cookie"> | undefined {
 if (typeof document === "undefined") {
  return undefined;
 }

 return document;
}

function buildCookie(name: string, value: string, options: SetCookieOptions): string {
 const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];

 if (options.path) {
  parts.push(`path=${options.path}`);
 }

 if (options.domain) {
  parts.push(`domain=${options.domain}`);
 }

 if (options.maxAge !== undefined) {
  parts.push(`max-age=${options.maxAge}`);
 }

 if (options.expires) {
  parts.push(`expires=${options.expires.toUTCString()}`);
 }

 if (options.sameSite) {
  parts.push(`samesite=${options.sameSite}`);
 }

 if (options.secure) {
  parts.push("secure");
 }

 return parts.join("; ");
}
