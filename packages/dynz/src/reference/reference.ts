import type { ValueType } from "..";

export const REFERENCE_TYPE = "_dref" as const;

export type Reference<T extends string = string> = {
  readonly type: typeof REFERENCE_TYPE;
  readonly path: T;
};

export function isReference(value: unknown): value is Reference {
  return (
    typeof value === "object" && value !== null && "type" in value && value.type === REFERENCE_TYPE && "path" in value
  );
}

/**
 * Describes either a value or a reference.
 */
export type ValueOrReference<T extends ValueType = ValueType> = T | Reference;

/**
 * Creates a reference to another field's value in the schema.
 *
 * References allow you to dynamically access values from other fields
 * during validation. The path uses dot-notation relative to the schema root.
 *
 * References can be used in:
 * - **Rules**: `min(ref('otherField'))`
 * - **Predicates**: `eq(ref('status'), v('active'))`
 * - **Transformers**: `sum(ref('price'), ref('tax'))`
 *
 * @category Helper
 * @param path - The dot-notation path to the referenced field
 * @returns A Reference to the field's value
 *
 * @example
 * // Reference a sibling field in validation
 * string({ rules: [equals(ref('password'))] })  // confirmPassword must equal password
 *
 * @example
 * // Reference in a predicate
 * conditional({
 *   when: eq(ref('country'), v('US')),
 *   then: minLength(v(5))
 * })
 *
 * @example
 * // Reference in a transformer
 * number({
 *   rules: [min(sum(ref('cost'), ref('margin')))]
 * })
 *
 * @example
 * // Reference nested fields
 * ref('address.zipCode')
 *
 * @see {@link v} - For static/constant values
 * @see {@link r} - Shorthand alias for ref()
 */
export function ref<const T extends string>(path: T): Reference<T> {
  return {
    type: REFERENCE_TYPE,
    path,
  };
}
