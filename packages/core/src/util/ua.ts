export interface UserAgentEnv {
  navigator?: { userAgent?: string };
}

export function getUserAgent(env: UserAgentEnv = {}): string {
  const navigatorLike = env.navigator ?? getRuntimeNavigator();
  return navigatorLike?.userAgent ?? "";
}

function getRuntimeNavigator(): { userAgent?: string } | undefined {
  if (typeof navigator === "undefined") {
    return undefined;
  }

  return navigator;
}
