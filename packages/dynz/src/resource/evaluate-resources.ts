import { isIncluded } from "../conditions";
import { resolve, resolvePredicate } from "../functions";
import { type ResolveContext, type Schema, SchemaType } from "../types";
import { getNested } from "../utils";
import { findResources, type ResourceDeclaration } from "./find-resource";
import type { ResourceState, ResourceStates } from "./resource";

export type ResourceKey = string | number | boolean;

export type EnabledResource = ResourceDeclaration & {
  /** The resolved value the resource is looked up by. */
  key: ResourceKey;
};

/**
 * Looks up one resource instance by its key.
 *
 * @param key - The resolved key of the instance
 * @param resource - The instance being looked up (its path, name, declaration and key)
 */
export type ResourceResolver<TData = unknown> = (
  key: ResourceKey,
  resource: EnabledResource
) => Promise<ResourceState<TData>> | ResourceState<TData>;

/** Resolvers by resource name. */
export type ResourceResolvers = Record<string, ResourceResolver>;

/**
 * Looks up every enabled resource (see {@link getEnabledResources}) with the resolver
 * registered under its name, in parallel.
 *
 * Resources are evaluated in a single pass: a `resourceRef` in an `included`, `key` or
 * `enabled` does not see the states being looked up here.
 *
 * @returns the states by resource instance path, ready to pass as `resources` in a
 *   resolve context
 * @throws when an enabled resource has no resolver, or a resolver throws
 *
 * @example
 * const resources = await evaluateResources(schema, values, {
 *   vehicle: async (plate) => {
 *     const car = await api.lookup(plate);
 *     return car ? { outcome: "found", data: car } : { outcome: "not_found" };
 *   },
 * });
 * // { "$.vehicle": { outcome: "found", data: { ... } } }
 */
export async function evaluateResources(
  schema: Schema,
  values: unknown,
  resolvers: ResourceResolvers
): Promise<ResourceStates> {
  const entries = await Promise.all(
    getEnabledResources(schema, values).map(async (enabled) => {
      const resolver = resolvers[enabled.name];

      if (resolver === undefined) {
        throw new Error(`No resolver for resource "${enabled.name}" at ${enabled.path}`);
      }

      return [enabled.path, await resolver(enabled.key, enabled)] as const;
    })
  );

  return Object.fromEntries(entries);
}

/**
 * The resource instances that should be looked up for `values`.
 *
 * Every resource declared in `schema` is expanded into one instance per array item it sits
 * in (`$.drivers.[].vehicle` → `$.drivers.[0].vehicle`, `$.drivers.[1].vehicle`, …).
 * An instance is discarded when:
 * - the object declaring it is not included (or is not the union member the values select);
 * - its `key` does not resolve to a primitive (string, number or boolean);
 * - its `enabled` does not evaluate to `true`.
 *
 * References in `key` and `enabled` resolve from the object declaring the resource:
 * `ref("plate")` is that object's field, `ref("$.plate")` the root's.
 */
export function getEnabledResources(schema: Schema, values: unknown): EnabledResource[] {
  const context: ResolveContext = { schema, values };

  return findResources(schema)
    .flatMap((declaration) =>
      expandArrayItems(declaration.objectPath, schema, values).map((objectPath) => ({
        ...declaration,
        objectPath,
        path: `${objectPath}${declaration.path.slice(declaration.objectPath.length)}`,
      }))
    )
    .filter(({ objectPath, resource }) => isDeclaredOn(objectPath, resource, schema, values))
    .flatMap((declaration) => {
      // evaluated from the resource's own path (a child of the declaring object), bare
      // references address the fields of that object
      const key = resolve(declaration.resource.key, declaration.path, context);

      return isResourceKey(key) ? [{ ...declaration, key }] : [];
    })
    .filter(({ resource, path }) =>
      resource.enabled === undefined || typeof resource.enabled === "boolean"
        ? resource.enabled !== false
        : resolvePredicate(resource.enabled, path, context) === true
    );
}

/**
 * Whether the object at `objectPath` is included and is the one declaring `resource`. The
 * latter fails when a discriminated union member other than the declaring one is selected.
 */
function isDeclaredOn(
  objectPath: string,
  resource: ResourceDeclaration["resource"],
  schema: Schema,
  values: unknown
): boolean {
  if (!isIncluded(schema, objectPath, values)) {
    return false;
  }

  const declaring = getNested(objectPath, schema, values)?.schema;

  return (
    declaring?.type === SchemaType.OBJECT &&
    Object.values(declaring.resources ?? {}).some((declared) => declared === resource)
  );
}

/**
 * Replaces every `[]` (any array item) in `path` with the indices of the items present in
 * `values`, outermost first.
 */
function expandArrayItems(path: string, schema: Schema, values: unknown): string[] {
  const index = path.indexOf("[]");

  if (index === -1) {
    return [path];
  }

  // the array itself: the path up to the `.` before `[]`
  const items = getNested(path.slice(0, index - 1), schema, values)?.value;

  return (Array.isArray(items) ? items : []).flatMap((_, item) =>
    expandArrayItems(`${path.slice(0, index)}[${item}]${path.slice(index + 2)}`, schema, values)
  );
}

function isResourceKey(value: unknown): value is ResourceKey {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}
