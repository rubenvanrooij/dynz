import type { ParamaterValue, Predicate } from "../functions";
import { toParamaterValue } from "../schemas/shared";

export const RESOURCE_TYPE = "resource" as const;
export const RESOURCE_REFERENCE_TYPE = "_rref" as const;

/**
 * A resource: external data an object schema depends on, looked up by `key`
 * (e.g. a vehicle looked up by its licence plate).
 *
 * Resources are declared on an object schema with `.setResources(...)` and read with
 * {@link resourceRef}. Like everything else in a schema they are plain JSON: how a
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
 * @param options.key - The value the resource is looked up by, usually a reference
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

export function isResource(value: unknown): value is Resource {
  return typeof value === "object" && value !== null && "type" in value && value.type === RESOURCE_TYPE;
}

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
