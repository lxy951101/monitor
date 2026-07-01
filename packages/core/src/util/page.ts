export interface PageUrlEnv {
 location?: { href: string };
}

export function getPageUrl(env: PageUrlEnv = {}): string {
 const location = env.location ?? getRuntimeLocation();
 return location?.href ?? "";
}

function getRuntimeLocation(): { href: string } | undefined {
 if (typeof window === "undefined") {
  return undefined;
 }

 return window.location;
}
