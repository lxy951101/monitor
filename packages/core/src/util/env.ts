export interface NavigatorLike {
 userAgent?: string;
}

export function isBrowserEnv(): boolean {
 return typeof window !== "undefined" && typeof document !== "undefined";
}

export function getUserAgent(navigatorLike?: NavigatorLike): string {
 const target = navigatorLike ?? getNavigatorLike();
 return target?.userAgent ?? "";
}

export function isMobileUserAgent(userAgent = getUserAgent()): boolean {
 return /android|iphone|ipad|ipod|mobile/iu.test(userAgent);
}

const DEFAULT_SPIDER_UA_PATTERNS: readonly string[] = [
 "baiduspider",
 "googlebot",
 "bingbot",
 "slurp",
 "duckduckbot",
 "yandexbot",
 "facebot",
 "ia_archiver",
 "mj12bot",
 "ahrefsbot",
 "semrushbot",
 "dotbot",
 "screaming frog",
 "petalbot"
];

export function checkIsSpider(
 userAgent?: string,
 patterns: readonly string[] = DEFAULT_SPIDER_UA_PATTERNS
): boolean {
 const agent = (userAgent ?? getUserAgent()).toLowerCase();

 return patterns.some((pattern) => agent.includes(pattern));
}

const OS_UA_MAP: Readonly<Record<string, RegExp>> = {
 iOS: /iphone|ipad|ipod/iu,
 Android: /android/iu,
 Mac: /mac(?![._\d])/iu,
 Windows: /windows/iu,
 Linux: /linux/iu
};

export function getOsByUA(userAgent?: string): string {
 const agent = userAgent ?? getUserAgent();

 for (const [os, pattern] of Object.entries(OS_UA_MAP)) {
  if (pattern.test(agent)) {
   return os;
  }
 }

 return "";
}

export interface ConnectionInfo {
 effectiveType?: string;
}

export function getConnectionType(): string | undefined {
 if (typeof navigator === "undefined") {
  return undefined;
 }

 const nav = navigator as Navigator & { connection?: ConnectionInfo };

 if (nav.connection?.effectiveType) {
  return nav.connection.effectiveType;
 }

 // 降级：尝试从 UA 中提取 NetType
 const ua = getUserAgent();
 const match = ua.match(/NetType\/(\w+)/i);

 return match ? match[1] : undefined;
}

function getNavigatorLike(): NavigatorLike | undefined {
 if (typeof navigator === "undefined") {
  return undefined;
 }

 return navigator;
}
