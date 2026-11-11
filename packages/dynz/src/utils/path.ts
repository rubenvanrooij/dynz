export function ensureAbsolutePath(fieldPath: string, path: string): string {
  if (fieldPath.startsWith("$")) {
    return fieldPath;
  }

  return `${getParent(path)}.${fieldPath}`;
}

/**
 * The segments of a path, regardless of how array items are written:
 * `$.drivers.[1].plate`, `$.drivers[1].plate` and `$.drivers.1.plate` all give
 * `["$", "drivers", "1", "plate"]`.
 */
export function pathSegments(path: string): string[] {
  return path.split(/[.[\]]/).filter(Boolean);
}

function getParent(path: string): string {
  return path === "$" ? "$" : path.split(".").slice(0, -1).join(".");
}
