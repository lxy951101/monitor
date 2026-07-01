export function safeJsonStringify(value: unknown): string {
  const seen = new WeakSet<object>();

  try {
    const result = JSON.stringify(value, (_key, child) => {
      if (typeof child === "bigint") {
        return child.toString();
      }

      if (child && typeof child === "object") {
        if (seen.has(child)) {
          return "[Circular]";
        }

        seen.add(child);
      }

      return child;
    });

    return result ?? "";
  } catch (error) {
    return stringifyFallback(error);
  }
}

function stringifyFallback(error: unknown): string {
  try {
    return JSON.stringify(String(error));
  } catch {
    return "\"[Unserializable]\"";
  }
}
