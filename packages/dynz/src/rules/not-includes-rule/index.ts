import { type ParamaterValue, resolve } from "../../functions";
import type { ErrorMessageFromRule, ExtractResolvedRules, RuleFn, Schema, ValueType } from "../../types";
import { isArray, isString } from "../../validate/validate-type";

export type NotIncludesRule<T extends ParamaterValue = ParamaterValue> = {
  type: "not_includes";
  notIncludes: T;
  code?: string | undefined;
};

export type NotIncludesRuleErrorMessage = ErrorMessageFromRule<NotIncludesRule, ValueType | undefined, "notIncludes">;

/**
 * Creates a non-inclusion validation rule for string and array fields.
 *
 * Rules are validation constraints that are attached to schema fields.
 * They define what values are valid and produce validation errors when violated.
 *
 * @category Rule
 * @param notIncludes - The value that must not be present (static value, reference, or transformer)
 * @param code - Optional custom error code for this validation
 * @returns A NotIncludesRule that validates !string.includes(notIncludes) or array.every(item => item !== notIncludes)
 *
 * @example
 * // String must not contain the substring "banned"
 * string({ rules: [notIncludes(v("banned"))] })
 *
 * @example
 * // Array must not contain the value "admin"
 * array(string(), { rules: [notIncludes(v("admin"))] })
 *
 * @example
 * // Dynamic — must not include a value from another field
 * string({ rules: [notIncludes(ref("forbiddenWord"))] })
 *
 * @see {@link includes} - Inverse rule
 */
export function buildNotIncludesRule<T extends ParamaterValue>(notIncludes: T, code?: string): NotIncludesRule<T> {
  return { notIncludes, type: "not_includes", code };
}

export const notIncludesRule: RuleFn<
  Schema,
  Extract<ExtractResolvedRules<Schema>, NotIncludesRule>,
  NotIncludesRuleErrorMessage
> = ({ rule, value, path, context }) => {
  if (!isString(value) && !isArray(value)) {
    throw new Error("notIncludesRule expects a string or array value");
  }

  const expected = resolve(rule.notIncludes, path, context);

  if (expected === undefined) {
    return undefined;
  }

  const found = isString(value)
    ? isString(expected) && value.includes(expected)
    : value.some((item) => item === expected);

  return !found
    ? undefined
    : {
        code: "not_includes",
        notIncludes: expected,
        message: `The value ${value} for schema ${path} should not include ${expected}`,
      };
};
