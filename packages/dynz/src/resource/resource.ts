import type { ParamaterValue, Predicate } from "../functions";
import { toParamaterValue } from "../schemas/shared";

export const RESOURCE_TYPE = "resource" as const;
export const RESOURCE_REFERENCE_TYPE = "_rref" as const;

/**
 * A resource: external data an object schema depends on, looked up by `key`
 * (e.g. a vehicle looked up by its licence plate).
 *
 * Resources are declared on an object schema with `.setResources(...)` and read with
 * {@link resourceRef}.
 *
 * References in `key` and `enabled` resolve from the object the resource is declared on:
 * `ref("plate")` is that object's `plate` field, while `ref("$.plate")` is the root's
 * (see {@link resourceReferencePath}). Like everything else in a schema they are plain JSON: how a
 * resource is fetched is not part of the schema.
 *
 * @typeParam TData - Shape of the resource's data. Type-level only; not serialized.
 * @typeParam TOutcome - The outcomes a lookup can end in.
 */
export type Resource<TData = unknown, TOutcome extends string = string> = {
  readonly type: typeof RESOURCE_TYPE;
  /** The value the resource is looked up by. */
  readonly key: ParamaterValue;
  /** Whether the resource should be looked up at all. Defaults to `true`. */
  readonly enabled?: boolean | Predicate | undefined;
  /** The outcomes a lookup can end in, e.g. `["found", "not_found"]`. */
  readonly outcomes: readonly TOutcome[];
  /** Type-level carrier for the resource's data; never set at runtime. */
  readonly __data?: TData;
};

export type ResourceOptions<TOutcome extends string> = {
  key: ParamaterValue | string | number | boolean | Date;
  enabled?: boolean | Predicate;
  outcomes: readonly TOutcome[];
};

/**
 * Declares a resource for use in `object(...).setResources(...)`.
 *
 * @category Resource
 * @param options.key - The value the resource is looked up by, usually a reference to a
 *   field of the object the resource is declared on
 * @param options.enabled - Whether the resource should be looked up at all (default `true`)
 * @param options.outcomes - The outcomes a lookup can end in
 *
 * @example
 * object({ hasCar: boolean(), plate: string() }).setResources({
 *   vehicle: resource<Vehicle>({
 *     key: ref("plate"),
 *     enabled: eq(ref("hasCar"), true),
 *     outcomes: ["found", "not_found"],
 *   }),
 * })
 */
export function resource<TData = unknown, const TOutcome extends string = string>(
  options: ResourceOptions<TOutcome>
): Resource<TData, TOutcome> {
  return {
    type: RESOURCE_TYPE,
    key: toParamaterValue(options.key),
    ...(options.enabled !== undefined ? { enabled: options.enabled } : {}),
    outcomes: options.outcomes,
  };
}

/**
 * The absolute path a reference in a resource's `key` or `enabled` points to.
 *
 * Unlike references in rules and predicates (which address siblings), these resolve from
 * the object the resource is declared on:
 * - `plate` → the `plate` field of that object
 * - `$.plate` → the `plate` field of the root
 *
 * @param refPath - The reference's path, e.g. `plate` or `$.plate`
 * @param objectPath - Absolute path of the object declaring the resource, e.g. `$.driver`
 *
 * @example
 * resourceReferencePath("plate", "$.driver")   // "$.driver.plate"
 * resourceReferencePath("$.plate", "$.driver") // "$.plate"
 */
export function resourceReferencePath(refPath: string, objectPath: string): string {
  return refPath.startsWith("$") ? refPath : `${objectPath}.${refPath}`;
}

export function isResource(value: unknown): value is Resource {
  return typeof value === "object" && value !== null && "type" in value && value.type === RESOURCE_TYPE;
}

/**
 * The outcome of looking up one resource instance, as supplied by whoever fetched it.
 */
export type ResourceState<TData = unknown, TOutcome extends string = string> = {
  /** One of the resource's declared `outcomes`. */
  outcome: TOutcome;
  /** The looked-up data, if any. */
  data?: TData;
};

/**
 * The states of all looked-up resource instances, by the instance's absolute path:
 * the path of the declaring object plus the resource name, e.g. `$.vehicle` or
 * `$.drivers.[2].vehicle`. Array items may also be written `[2]` or `.2`; paths are
 * compared by their segments. A missing entry means "not looked up (yet)".
 */
export type ResourceStates = Record<string, ResourceState>;

export type ResourceReference<T extends string = string> = {
  readonly type: typeof RESOURCE_REFERENCE_TYPE;
  /** `<resource>.<field>`, e.g. `vehicle.outcome` or `vehicle.data.make`. */
  readonly path: T;
};

/**
 * References a resource declared with `.setResources(...)` on an enclosing object.
 *
 * The first segment is the resource name; the rest addresses a part of it:
 * - `vehicle.outcome` — the outcome of the lookup (one of the resource's `outcomes`)
 * - `vehicle.data.<path>` — a field of the looked-up data
 *
 * Usable wherever a reference is: rules, predicates and transformers.
 *
 * @category Resource
 * @example
 * manualDetails: object({ ... }).setIncluded(eq(resourceRef("vehicle.outcome"), "not_found"))
 */
export function resourceRef<const T extends string>(path: T): ResourceReference<T> {
  return {
    type: RESOURCE_REFERENCE_TYPE,
    path,
  };
}

export function isResourceReference(value: unknown): value is ResourceReference {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === RESOURCE_REFERENCE_TYPE &&
    "path" in value
  );
}
