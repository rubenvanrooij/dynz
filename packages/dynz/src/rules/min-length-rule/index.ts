import { type ParamaterValue, resolveExpected } from "../../functions";
import type { ArraySchema, StringSchema } from "../../schemas";
import {
  type ErrorMessageFromRule,
  type ExtractResolvedRules,
  type RuleFn,
  type Schema,
  SchemaType,
} from "../../types";
import { isArray, isNumber, isString, validateType } from "../../validate/validate-type";

export type MinLengthRule<T extends ParamaterValue<number> = ParamaterValue<number>> = {
  type: "min_length";
  min: T;
  code?: string | undefined;
};

export type MinLengthRuleErrorMessage = ErrorMessageFromRule<MinLengthRule, number, "min">;

/**
 * Creates a minimum length validation rule for string and array fields.
 *
 * Rules are validation constraints that are attached to schema fields.
 * They define what values are valid and produce validation errors when violated.
 *
 * @category Rule
 * @param min - The minimum required length (static value, reference, or transformer)
 * @param code - Optional custom error code for this validation
 * @returns A MinLengthRule that validates value.length >= min
 *
 * @example
 * // String must be at least 3 characters
 * string({ rules: [minLength(v(3))] })
 *
 * @example
 * // Array must have at least 1 item
 * array({ schema: string(), rules: [minLength(v(1))] })
 *
 * @example
 * // Dynamic minimum from another field
 * string({ rules: [minLength(ref('requiredLength'))] })
 *
 * @see {@link maxLength} - Maximum length rule
 * @see {@link size} - Size transformer (for predicates)
 */
export function minLength<T extends ParamaterValue<number> = ParamaterValue<number>>(
  min: T,
  code?: string
): MinLengthRule<T> {
  return { min, type: "min_length", code };
}

export const minLengthRule: RuleFn<
  Schema,
  Extract<ExtractResolvedRules<Schema>, MinLengthRule>,
  MinLengthRuleErrorMessage
> = ({ rule, value, path, context }) => {
  if (!isArray(value) && !isString(value)) {
    throw new Error("minLengthRule expects either a string or an array");
  }

  const min = resolveExpected(rule.min, path, context, SchemaType.NUMBER);

  if (min === undefined) {
    return undefined;
  }

  return value.length >= min
    ? undefined
    : {
        code: "min_length",
        min: min,
        message: `The value ${value} for schema ${path} should have at least a length of ${min}`,
      };
};
