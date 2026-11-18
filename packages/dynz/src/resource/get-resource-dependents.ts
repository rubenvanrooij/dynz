import { type Schema, SchemaType } from "../types";
import { isResourceReference } from "./resource";

type Dependent = { path: string; names: string[] };

/**
 * The schema paths whose validation reads each resource, by resource name.
 *
 * A path depends on a resource when its own `rules`, `included`, `required`, `mutable` or
 * `options` contain a `resourceRef` to it, or when an ancestor's `included` does (an
 * excluded ancestor excludes the path). Array items are written `[]`, as in
 * `getRulesDependenciesMap`.
 *
 * References are matched by resource name, not by instance: a field reading `driverClaims`
 * depends on every `driverClaims` instance.
 *
 * @example
 * getResourceDependents(
 *   object({
 *     plate: string(),
 *     make: string().setIncluded(eq(resourceRef("vehicle.outcome"), "not_found")),
 *   }).setResources({ vehicle })
 * )
 * // { vehicle: ["$.make"] }
 */
export function getResourceDependents(schema: Schema, path = "$"): Record<string, string[]> {
  const pairs = collectDependents(schema, path, []).flatMap(({ path, names }) => names.map((name) => ({ name, path })));

  return Object.fromEntries(
    unique(pairs.map(({ name }) => name)).map((name) => [
      name,
      pairs.filter((pair) => pair.name === name).map((pair) => pair.path),
    ])
  );
}

function collectDependents(schema: Schema, path: string, inherited: string[]): Dependent[] {
  const own = resourceNames([
    schema.rules,
    schema.included,
    schema.required,
    schema.mutable,
    schema.type === SchemaType.OPTIONS ? schema.options : undefined,
  ]);
  const names = unique([...inherited, ...own]);
  // an excluded ancestor excludes everything below it
  const forChildren = unique([...inherited, ...resourceNames(schema.included)]);
  const self = names.length > 0 ? [{ path, names }] : [];

  if (schema.type === SchemaType.ARRAY) {
    return [...self, ...collectDependents(schema.schema, `${path}.[]`, forChildren)];
  }

  if (schema.type === SchemaType.OBJECT) {
    return [
      ...self,
      ...Object.entries(schema.fields).flatMap(([key, field]) =>
        collectDependents(field as Schema, `${path}.${key}`, forChildren)
      ),
    ];
  }

  if (schema.type === SchemaType.DISCRIMINATED_UNION) {
    const members = schema.schemas.flatMap((member) =>
      Object.entries(member).flatMap(([key, field]) =>
        // a literal (e.g. the discriminator's value) has no schema of its own
        typeof field === "object" && field !== null
          ? collectDependents(field as Schema, `${path}.${key}`, forChildren)
          : []
      )
    );

    return [...self, ...members];
  }

  return self;
}

/**
 * The names of the resources referenced anywhere in `value`. Rules, predicates and
 * transformers are plain JSON, so a structural walk finds every `resourceRef` without
 * knowing their shapes.
 */
function resourceNames(value: unknown): string[] {
  if (isResourceReference(value)) {
    return [value.path.split(".")[0] as string];
  }

  if (Array.isArray(value)) {
    return unique(value.flatMap(resourceNames));
  }

  if (typeof value === "object" && value !== null) {
    return unique(Object.values(value).flatMap(resourceNames));
  }

  return [];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
