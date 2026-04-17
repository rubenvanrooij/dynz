import { type ParamaterValue, resolveExpected } from "../../functions";
import {
  type ErrorMessageFromRule,
  type ExtractResolvedRules,
  type RuleFn,
  type Schema,
  SchemaType,
} from "../../types";
import { isNumber } from "../../validate/validate-type";

export type MaxRule<T extends ParamaterValue<number> = ParamaterValue<number>> = {
  type: "max";
  max: T;
  code?: string | undefined;
};

export type MaxRuleErrorMessage = ErrorMessageFromRule<MaxRule, number, "max">;

/**
 * Creates a maximum value validation rule for number fields.
 *
 * Rules are validation constraints that are attached to schema fields.
 * They define what values are valid and produce validation errors when violated.
 *
 * **Note:** This is different from the {@link lt} predicate! This rule validates
 * field values, while `lt()` is a boolean expression for conditional logic.
 *
 * @category Rule
 * @param max - The maximum allowed value (static value, reference, or transformer)
 * @param code - Optional custom error code for this validation
 * @returns A MaxRule that validates value <= max
 *
 * @example
 * // Simple maximum value
 * number({ rules: [max(v(100))] })
 *
 * @example
 * // Dynamic maximum from another field
 * number({ rules: [max(ref('maxQuantity'))] })
 *
 * @example
 * // Maximum based on calculated value
 * number({
 *   rules: [max(sub(ref('total'), ref('reserved')))]
 * })
 *
 * @see {@link min} - Minimum value rule
 * @see {@link lt} - Less than predicate (for conditional logic)
 * @see {@link lte} - Less than or equal predicate (for conditional logic)
 */
export function buildMaxRule<T extends ParamaterValue<number>>(max: T, code?: string): MaxRule<T> {
  return { max, type: "max", code };
}

export const maxRule: RuleFn<Schema, Extract<ExtractResolvedRules<Schema>, MaxRule>, MaxRuleErrorMessage> = ({
  rule,
  value,
  path,
  context,
}) => {
  if (!isNumber(value)) {
    throw new Error("maxRule expects a number value");
  }

  const max = resolveExpected(rule.max, path, context, SchemaType.NUMBER);

  if (max === undefined) {
    return undefined;
  }

  return value <= max
    ? undefined
    : {
        code: "max",
        max,
        message: `The value ${value} for schema ${path} should have a maximum of ${max}`,
      };
};
