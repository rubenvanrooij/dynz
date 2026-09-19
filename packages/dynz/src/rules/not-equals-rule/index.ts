import { type ParamaterValue, resolveExpected } from "../../functions";
import type { ErrorMessageFromRule, ExtractResolvedRules, RuleFn, Schema } from "../../types";

export type NotEqualsRule<T extends ParamaterValue = ParamaterValue> = {
  type: "not_equals";
  notEquals: T;
  code?: string | undefined;
};

export type NotEqualsRuleErrorMessage = ErrorMessageFromRule<Omit<NotEqualsRule, "notEquals"> & { notEquals: unknown }>;

/**
 * Creates an inequality validation rule that checks if a field does not equal a specific value.
 *
 * Rules are validation constraints that are attached to schema fields.
 * They define what values are valid and produce validation errors when violated.
 *
 * **Note:** This is different from the {@link neq} predicate! This rule validates
 * field values, while `neq()` is a boolean expression for conditional logic.
 *
 * @category Rule
 * @param notEquals - The value the field must not equal (static value or reference)
 * @param code - Optional custom error code for this validation
 * @returns A NotEqualsRule that validates value !== notEquals
 *
 * @example
 * // Field must not equal a static value
 * string({ rules: [notEquals(v('banned'))] })
 *
 * @example
 * // New password must differ from the old one
 * string({ rules: [notEquals(ref('oldPassword'))] })
 *
 * @see {@link neq} - Not equals predicate (for conditional logic, not validation)
 * @see {@link equals} - Equals rule
 */
export function buildNotEqualsRule<T extends ParamaterValue>(notEquals: T, code?: string): NotEqualsRule<T> {
  return { notEquals, type: "not_equals", code };
}

export const notEqualsRule: RuleFn<
  Schema,
  Extract<ExtractResolvedRules<Schema>, NotEqualsRule>,
  NotEqualsRuleErrorMessage
> = ({ rule, value, path, context, schema }) => {
  const notEquals = resolveExpected(rule.notEquals, path, context, schema.type);
  return notEquals !== value
    ? undefined
    : {
        code: "not_equals",
        notEquals: notEquals,
        message: `The value for schema ${path} equals ${notEquals}`,
      };
};
