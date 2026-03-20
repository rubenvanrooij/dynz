import { type ParamaterValue, resolveExpected } from "../../functions";
import type { ArraySchema, StringSchema } from "../../schemas";
import {
  type ErrorMessageFromRule,
  type ExtractResolvedRules,
  type RuleFn,
  type Schema,
  SchemaType,
} from "../../types";
import { isArray, isString } from "../../validate/validate-type";

export type MaxLengthRule<T extends ParamaterValue<number> = ParamaterValue<number>> = {
  type: "max_length";
  max: T;
  code?: string | undefined;
};

export type MaxLengthRuleErrorMessage = ErrorMessageFromRule<MaxLengthRule, number, "max">;

/**
 * Creates a maximum length validation rule for string and array fields.
 *
 * Rules are validation constraints that are attached to schema fields.
 * They define what values are valid and produce validation errors when violated.
 *
 * @category Rule
 * @param max - The maximum allowed length (static value, reference, or transformer)
 * @param code - Optional custom error code for this validation
 * @returns A MaxLengthRule that validates value.length <= max
 *
 * @example
 * // String must be at most 100 characters
 * string({ rules: [maxLength(v(100))] })
 *
 * @example
 * // Array can have at most 10 items
 * array({ schema: string(), rules: [maxLength(v(10))] })
 *
 * @example
 * // Dynamic maximum from another field
 * string({ rules: [maxLength(ref('maxAllowedLength'))] })
 *
 * @see {@link minLength} - Minimum length rule
 * @see {@link size} - Size transformer (for predicates)
 */
export function maxLength<T extends ParamaterValue<number> = ParamaterValue<number>>(
  max: T,
  code?: string
): MaxLengthRule<T> {
  return { max, type: "max_length", code };
}

export const maxLengthRule: RuleFn<
  Schema,
  Extract<ExtractResolvedRules<Schema>, MaxLengthRule>,
  MaxLengthRuleErrorMessage
> = ({ rule, value, path, context }) => {
  if (!isString(value) && !isArray(value)) {
    throw new Error("maxLengthRule expects a string or array value");
  }

  const max = resolveExpected(rule.max, path, context, SchemaType.NUMBER);

  if (max === undefined) {
    return undefined;
  }

  return value.length <= max
    ? undefined
    : {
        code: "max_length",
        max,
        message: `The value ${value} for schema ${path} should have a maximum length of ${max}`,
      };
};
