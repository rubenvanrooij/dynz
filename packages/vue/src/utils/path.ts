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

function isIndex(segment: string): boolean {
  return /^\d+$/.test(segment);
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

/**
 * Writes `items[0].name` on a values object, creating missing intermediate
 * containers. A numeric next segment creates an array, anything else an object.
 */
export function setByPath(values: Record<string, unknown>, name: string, value: unknown): void {
  const segments = toPathSegments(name);

  if (segments.length === 0) {
    return;
  }

  let current: Record<string, unknown> = values;

  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i];
    const next = current[segment];

    if (next === null || typeof next !== "object") {
      const child = isIndex(segments[i + 1]) ? [] : {};
      current[segment] = child;
      current = child as unknown as Record<string, unknown>;
    } else {
      current = next as Record<string, unknown>;
    }
  }

  current[segments[segments.length - 1]] = value;
}

/**
 * Whether `path` points at `name` or at something nested inside it. Used to scope
 * error updates to a single field and its children (`items` also owns `items[0].name`).
 */
export function isPathWithin(path: string, name: string): boolean {
  if (name === "") {
    return true;
  }

  return path === name || path.startsWith(`${name}.`) || path.startsWith(`${name}[`);
}

/**
 * The dependency map represents array members as `items[]`. Normalize those to the
 * array itself so they can be matched against concrete paths such as `items[0].name`.
 */
export function normalizeDependencyName(name: string): string {
  return name.endsWith("[]") ? name.slice(0, -2) : name;
}
