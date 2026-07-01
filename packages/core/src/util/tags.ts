export function formatTags(tags: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(tags)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (isPrimitive(value)) {
      result[key] = String(value);
      continue;
    }

    try {
      result[key] = JSON.stringify(value);
    } catch {
      // 忽略无法序列化的值
    }
  }

  return result;
}

function isPrimitive(value: unknown): value is string | number | boolean {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}
