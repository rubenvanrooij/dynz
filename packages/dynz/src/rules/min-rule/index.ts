import { type ParamaterValue, resolveExpected, type Transformer } from "../../functions";
import type { NumberSchema } from "../../schemas";
import { type ErrorMessageFromRule, type ExtractResolvedRules, type RuleFn, SchemaType } from "../../types";

export type MinRule<T extends ParamaterValue<number> = ParamaterValue<number>, A extends Transformer = Transformer> = {
  type: "min";
  min: T;
  tranform?: A | undefined;
  code?: string | undefined;
};

export type MinRuleErrorMessage = ErrorMessageFromRule<MinRule, number, "min">;

/**
 * Creates a minimum value validation rule for number fields.
 *
 * Rules are validation constraints that are attached to schema fields.
 * They define what values are valid and produce validation errors when violated.
 *
 * **Note:** This is different from the {@link gt} predicate! This rule validates
 * field values, while `gt()` is a boolean expression for conditional logic.
 *
 * @category Rule
 * @param min - The minimum allowed value (static value, reference, or transformer)
 * @param code - Optional custom error code for this validation
 * @param transformer - Optional transformer to apply before validation
 * @returns A MinRule that validates value >= min
 *
 * @example
 * // Simple minimum value
 * number({ rules: [min(v(0))] })
 *
 * @example
 * // Dynamic minimum from another field
 * number({ rules: [min(ref('minPrice'))] })
 *
 * @example
 * // Minimum based on calculated value
 * number({
 *   rules: [min(sum(ref('cost'), ref('margin')))]
 * })
 *
 * @see {@link max} - Maximum value rule
 * @see {@link gt} - Greater than predicate (for conditional logic)
 * @see {@link gte} - Greater than or equal predicate (for conditional logic)
 */
export function min<T extends ParamaterValue<number>, A extends Transformer = Transformer>(
  min: T,
  code?: string,
  transformer?: A
): MinRule<T, A> {
  return { min, type: "min", code, tranform: transformer };
}

export const minRule: RuleFn<
  NumberSchema,
  Extract<ExtractResolvedRules<NumberSchema>, MinRule>,
  MinRuleErrorMessage
> = ({ rule, value, path, context }) => {
  const min = resolveExpected(rule.min, path, context, SchemaType.NUMBER);

  if (min === undefined) {
    return undefined;
  }

  return value >= min
    ? undefined
    : {
        code: "min",
        min,
        message: `The value ${value} for schema ${path} should be at least ${min}`,
      };
};
