import { isIncluded } from "../conditions";
import { resolve, resolvePredicate } from "../functions";
import { type ResolveContext, type Schema, SchemaType } from "../types";
import { expandArrayItems, getNested } from "../utils";
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
 * registered under its name.
 *
 * Resources may depend on other resources: a `resourceRef` in a resource's `key` or
 * `enabled`, or in the `included` of the object declaring it (or an ancestor), resolves
 * against the states looked up so far. Lookups therefore run in rounds: every instance that
 * is enabled given the current states is looked up in parallel, the results are added, and
 * the next round picks up what they enabled, until a round enables nothing new. A resource
 * without a state yet resolves to `undefined`.
 *
 * Only the instances enabled in the final round are returned: one enabled early (e.g. by
 * `neq(resourceRef("vehicle.outcome"), "found")` before `vehicle` settled) and disabled once
 * its dependency settled is dropped. Rounds are capped at the number of declared resources
 * plus one, so a cycle between resources terminates (with an unspecified result).
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
  const maxRounds = findResources(schema).length + 1;
  let states: ResourceStates = {};
  let enabled = getEnabledResources(schema, values, states);

  for (let round = 0; round < maxRounds; round++) {
    // values are fixed, so an instance with a state has its current key
    const todo = enabled.filter(({ path }) => !(path in states));

    if (todo.length === 0) {
      break;
    }

    states = {
      ...states,
      ...Object.fromEntries(await Promise.all(todo.map((instance) => lookup(instance, resolvers)))),
    };
    enabled = getEnabledResources(schema, values, states);
  }

  return Object.fromEntries(enabled.flatMap(({ path }) => (path in states ? [[path, states[path]]] : [])));
}

async function lookup(
  instance: EnabledResource,
  resolvers: ResourceResolvers
): Promise<readonly [string, ResourceState]> {
  const resolver = resolvers[instance.name];

  if (resolver === undefined) {
    throw new Error(`No resolver for resource "${instance.name}" at ${instance.path}`);
  }

  return [instance.path, await resolver(instance.key, instance)];
}

/**
 * The resource instances that should be looked up for `values`.
 *
 * Every resource declared in `schema` is expanded into one instance per array item it sits
 * in (`$.drivers.[].vehicle` → `$.drivers.[0].vehicle`, `$.drivers.[1].vehicle`, …).
 * An instance is discarded when:
 * - the object declaring it is not included (or is not the union member the values select);
 * - its `key` does not resolve to a non-empty string, a finite number or a boolean;
 * - its `enabled` does not evaluate to `true`.
 *
 * References in `key` and `enabled` resolve from the object declaring the resource:
 * `ref("plate")` is that object's field, `ref("$.plate")` the root's. Resource references
 * (in `key`, `enabled` and `included`) resolve against `resources`; one without a state
 * resolves to `undefined`.
 *
 * @param resources - States of the resources looked up so far
 */
export function getEnabledResources(schema: Schema, values: unknown, resources?: ResourceStates): EnabledResource[] {
  const context: ResolveContext = { schema, values, resources };

  return findResources(schema)
    .flatMap((declaration) =>
      expandArrayItems(declaration.objectPath, schema, values).map((objectPath) => ({
        ...declaration,
        objectPath,
        path: `${objectPath}${declaration.path.slice(declaration.objectPath.length)}`,
      }))
    )
    .filter(({ objectPath, resource }) => isDeclaredOn(objectPath, resource, context))
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
  { schema, values, resources }: ResolveContext
): boolean {
  if (!isIncluded(schema, objectPath, values, resources)) {
    return false;
  }

  const declaring = getNested(objectPath, schema, values)?.schema;

  return (
    declaring?.type === SchemaType.OBJECT &&
    Object.values(declaring.resources ?? {}).some((declared) => declared === resource)
  );
}

/** A non-empty string, a finite number or a boolean: an empty field is not worth a lookup. */
function isResourceKey(value: unknown): value is ResourceKey {
  if (typeof value === "string") {
    return value !== "";
  }

  return typeof value === "number" ? Number.isFinite(value) : typeof value === "boolean";
}
