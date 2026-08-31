/**
 * Deep clones plain objects and arrays, passing every other value through by
 * reference. `structuredClone` cannot be used here because schemas may hold values
 * it rejects (functions on class instances) or mangles, and dynz' file schema
 * expects the very same `File` instance back.
 */
export function cloneValues<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry) => cloneValues(entry)) as unknown as T;
  }

  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(value)) {
      result[key] = cloneValues(entry);
    }

    return result as T;
  }

  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}
