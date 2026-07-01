export function deepCopy<Value>(value: Value): Value {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepCopy(item)) as unknown as Value;
  }

  const copy: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    copy[key] = deepCopy(val);
  }

  return copy as Value;
}
