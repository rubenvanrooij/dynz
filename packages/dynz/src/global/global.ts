export const GLOBAL_TYPE = "_dglobal" as const;

export type GlobalReference<K extends string = string> = {
  readonly type: typeof GLOBAL_TYPE;
  readonly key: K;
};

export function isGlobalReference(value: unknown): value is GlobalReference {
  return typeof value === "object" && value !== null && "type" in value && value.type === GLOBAL_TYPE && "key" in value;
}

/**
 * Creates a reference to a global variable — a value supplied at `validate()`-call time
 * that lives outside the schema's own value tree (e.g. the current date, the current
 * user's id, a feature flag), as opposed to {@link ref}, which references another
 * field's value.
 *
 * Global references can be used anywhere a {@link ref} can:
 * - **Rules**: `min(global('minAmount'))`
 * - **Predicates**: `eq(global('featureFlag'), v(true))`
 * - **Transformers**: `sum(ref('price'), global('shippingCost'))`
 *
 * The value is supplied via `validate(schema, current, new, { globals: { key: value } })`.
 * A key with no matching entry in `globals` throws — unlike {@link ref}, which resolves
 * an unresolvable path to `undefined`, a missing global is treated as a configuration
 * error: the caller forgot to supply a value the schema depends on.
 *
 * @category Helper
 * @param key - The name of the global variable
 * @returns A GlobalReference to the named global
 *
 * @example
 * // Require a field only when a feature flag is enabled
 * string().setIncluded(eq(global('betaFeaturesEnabled'), v(true)))
 *
 * @example
 * // Compare against an externally supplied "now"
 * date().setRequired(gte(global('now'), ref('submittedAt')))
 *
 * @see {@link ref} - For referencing another field's value
 * @see {@link v} - For static/constant values
 */
export function global<const K extends string>(key: K): GlobalReference<K> {
  return {
    type: GLOBAL_TYPE,
    key,
  };
}
