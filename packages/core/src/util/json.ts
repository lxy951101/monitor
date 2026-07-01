export function safeJsonStringify(value: unknown): string {
 const seen = new WeakSet<object>();

 return JSON.stringify(value, (_key, child) => {
  if (typeof child !== "object" || child === null) {
   return child;
  }

  if (seen.has(child)) {
   return "[Circular]";
  }

  seen.add(child);
  return child;
 });
}
