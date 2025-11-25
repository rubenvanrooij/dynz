export function ensureAbsolutePath(fieldPath: string, path: string): string {
  if (fieldPath.startsWith("$")) {
    return fieldPath;
  }

  return `${getParent(path)}.${fieldPath}`;
}

function getParent(path: string): string {
  return path === "$" ? "$" : path.split(".").slice(0, -1).join(".");
}
