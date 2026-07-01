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

function getNavigatorLike(): NavigatorLike | undefined {
  if (typeof navigator === "undefined") {
    return undefined;
  }

  return navigator;
}
