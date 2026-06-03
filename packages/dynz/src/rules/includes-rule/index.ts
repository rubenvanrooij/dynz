import { type ParamaterValue, resolve } from "../../functions";
import type { ErrorMessageFromRule, ExtractResolvedRules, RuleFn, Schema, ValueType } from "../../types";
import { isArray, isString } from "../../validate/validate-type";

export type IncludesRule<T extends ParamaterValue = ParamaterValue> = {
  type: "includes";
  includes: T;
  code?: string | undefined;
};

export type IncludesRuleErrorMessage = ErrorMessageFromRule<IncludesRule, ValueType | undefined, "includes">;

/**
 * Creates an inclusion validation rule for string and array fields.
 *
 * Rules are validation constraints that are attached to schema fields.
 * They define what values are valid and produce validation errors when violated.
 *
 * @category Rule
 * @param includes - The value that must be present (static value, reference, or transformer)
 * @param code - Optional custom error code for this validation
 * @returns An IncludesRule that validates string.includes(includes) or array.some(item => item === includes)
 *
 * @example
 * // String must contain the substring "hello"
 * string({ rules: [includes(v("hello"))] })
 *
 * @example
 * // Array must contain the value "admin"
 * array(string(), { rules: [includes(v("admin"))] })
 *
 * @example
 * // Dynamic — must include a value from another field
 * string({ rules: [includes(ref("requiredSubstring"))] })
 *
 * @see {@link notIncludes} - Inverse rule
 */
export function buildIncludesRule<T extends ParamaterValue>(includes: T, code?: string): IncludesRule<T> {
  return { includes, type: "includes", code };
}

export const includesRule: RuleFn<
  Schema,
  Extract<ExtractResolvedRules<Schema>, IncludesRule>,
  IncludesRuleErrorMessage
> = ({ rule, value, path, context }) => {
  if (!isString(value) && !isArray(value)) {
    throw new Error("includesRule expects a string or array value");
  }

  const expected = resolve(rule.includes, path, context);

  if (expected === undefined) {
    return undefined;
  }

  const found = isString(value)
    ? isString(expected) && value.includes(expected)
    : value.some((item) => item === expected);

  return found
    ? undefined
    : {
        code: "includes",
        includes: expected,
        message: `The value ${value} for schema ${path} should include ${expected}`,
      };
};
