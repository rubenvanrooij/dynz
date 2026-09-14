/**
 * Path helpers that translate between dynz' absolute JSON paths (`$.address.zip`,
 * `$.items[0].name`) and the field names consumers use in templates
 * (`address.zip`, `items[0].name`).
 */

/** Splits both dot and bracket notation: `items[0].name` → `["items", "0", "name"]` */
export function toPathSegments(name: string): string[] {
  return name.split(/[.[\]]/).filter(Boolean);
}

/** `address.zip` → `$.address.zip`; already absolute paths are returned as is. */
export function toAbsolutePath(name: string): string {
  if (name === "" || name === "$") {
    return "$";
  }

  return name.startsWith("$") ? name : `$.${name}`;
}

/**
 * `$.address.zip` → `address.zip`; the root path `$` maps to an empty field name.
 *
 * dynz separates array indices with a dot (`$.tags.[0]`). Field names drop it, so the
 * result is the `tags[0]` notation that templates and VeeValidate use. dynz accepts
 * both spellings on the way back in, since it splits on `.`, `[` and `]` alike.
 */
export function toFieldName(path: string): string {
  const name = path.startsWith("$.") ? path.slice(2) : path === "$" ? "" : path;

  return name.replaceAll(".[", "[");
}

/** Reads `items[0].name` off a (possibly reactive) values object. */
export function getByPath<T = unknown>(values: unknown, name: string): T | undefined {
  let current: unknown = values;

  for (const segment of toPathSegments(name)) {
    if (current === null || typeof current !== "object") {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current as T | undefined;
}
