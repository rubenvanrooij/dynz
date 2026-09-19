export function ensureAbsolutePath(fieldPath: string, path: string): string {
  if (fieldPath.startsWith("$")) {
    return fieldPath;
  }

  return `${getParent(path)}.${fieldPath}`;
}

/**
 * Canonicalizes a path to its dot-joined segments (e.g. `$.items.[0]` and
 * `$.items.0` both become `$.items.0`), so paths built with array-bracket notation
 * and paths built by joining plain segments compare equal as map keys.
 */
export function normalizePath(path: string): string {
  return path
    .split(/[.[\]]/)
    .filter(Boolean)
    .join(".");
}

function getParent(path: string): string {
  return path === "$" ? "$" : path.split(".").slice(0, -1).join(".");
}
