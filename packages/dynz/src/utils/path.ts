export function ensureAbsolutePath(fieldPath: string, path: string): string {
  if (fieldPath.startsWith("$")) {
    return fieldPath;
  }

  return `${getParent(path)}.${fieldPath}`;
}

function getParent(path: string): string {
  return path === "$" ? "$" : path.split(".").slice(0, -1).join(".");
}

/**
 * Splits an absolute dynz path into its segments, dropping the `$` root. Array indices
 * (bracketed segments) become numbers: `$.tags.[1].name` → `["tags", 1, "name"]`.
 */
export function toPathSegments(path: string): (string | number)[] {
  return path
    .split(".")
    .filter(Boolean)
    .splice(1)
    .map((segment) => {
      const index = /^\[(\d+)\]$/.exec(segment)?.[1];
      return index === undefined ? segment : Number(index);
    });
}
