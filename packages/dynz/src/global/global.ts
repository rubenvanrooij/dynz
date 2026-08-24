import type { EnumValues } from "../schemas";
import { SchemaType, type ValueType } from "../types";

export const GLOBAL_TYPE = "_dglobal" as const;

export const GlobalType = {
  STRING: SchemaType.STRING,
  NUMBER: SchemaType.NUMBER,
  BOOLEAN: SchemaType.BOOLEAN,
  DATE: SchemaType.DATE,
} as const;

export type GlobalType = EnumValues<typeof GlobalType>;

export type GlobalReference<K extends string = string, T extends GlobalType = GlobalType> = {
  readonly type: typeof GLOBAL_TYPE;
  readonly key: K;
  /**
   * The GlobalType this global's value must have. Carried at runtime (not just as a
   * type parameter) so it survives `JSON.stringify(schema)` and lets `validate()` check
   * the supplied value's type.
   */
  readonly globalType: T;
};

export function isGlobalReference(value: unknown): value is GlobalReference {
  return typeof value === "object" && value !== null && "type" in value && value.type === GLOBAL_TYPE && "key" in value;
}

/**
 * Creates a reference to a global variable — a value supplied at `validate()`-call time
 * that lives outside the schema's own value tree (e.g. the current date, a feature flag),
 * as opposed to {@link ref}, which references another field's value. Usable anywhere a
 * {@link ref} can be, e.g. `min(global('minAmount', GlobalType.NUMBER))`. The value is
 * supplied via `validate(schema, current, new, { globals: { key: value } })`; a missing
 * key throws, since — unlike an unresolvable `ref()` — it's a configuration error, not a
 * legitimately absent value.
 *
 * @category Helper
 * @param key - The name of the global variable
 * @param type - The GlobalType the global's value must have
 * @returns A GlobalReference to the named global
 *
 * @example
 * string().setIncluded(eq(global('betaFeaturesEnabled', GlobalType.BOOLEAN), v(true)))
 * date().setRequired(gte(global('now', GlobalType.DATE), ref('submittedAt')))
 *
 * @see {@link ref} - For referencing another field's value
 * @see {@link createGlobals} - For a shared, typo-checked set of global keys
 */
export function global<const K extends string, T extends GlobalType = GlobalType>(
  key: K,
  type: T
): GlobalReference<K, T> {
  return {
    type: GLOBAL_TYPE,
    globalType: type,
    key,
  };
}

/**
 * A globals contract: the {@link GlobalType} each global key holds. Plain,
 * JSON-serializable data — attach it alongside a serialized schema (e.g.
 * `{ schema: serialize(schema), globals: contract }`) so a remote consumer knows
 * exactly what to supply, without needing the TypeScript types that produced it.
 *
 * @see {@link createGlobals}
 */
export type GlobalsContract = Record<string, GlobalType>;

/** The shape a `validate()` globals map must have for a given {@link GlobalsContract}. */
export type GlobalValues<T extends GlobalsContract> = {
  [K in keyof T]: ValueType<T[K]>;
};

/**
 * Binds a fixed set of global keys to their {@link GlobalType}s, so a typo in `key` is
 * caught at compile time and each `global(key)` call no longer needs to repeat its type.
 * Returns a scoped `global(key)`, a `values()` identity helper for type-checking a
 * `validate()` globals map against the contract, and the contract itself (e.g. to send
 * alongside a serialized schema so a remote consumer knows what to supply).
 *
 * @category Helper
 * @param contract - Map of global key to the GlobalType it holds
 * @returns `{ contract, global, values }` scoped to the given contract
 *
 * @example
 * const { global, values } = createGlobals({ minAmount: GlobalType.NUMBER, now: GlobalType.DATE });
 * number().min(global("minAmount")); // OK — minAmount is a number
 * number().min(global("now"));       // type error — now is a date, not a number
 * validate(schema, undefined, input, { globals: values({ minAmount: 10, now: new Date() }) });
 *
 * @see {@link global} - The standalone variant, for a one-off global
 */
export function createGlobals<const TContract extends GlobalsContract>(
  contract: TContract
): {
  contract: TContract;
  values: <K extends GlobalValues<TContract>>(values: K) => K;
  global: <K extends keyof TContract & string>(key: K) => GlobalReference<K, TContract[K]>;
} {
  return {
    contract,
    values: (v) => v,
    global: (key) => global(key, contract[key]),
  };
}
