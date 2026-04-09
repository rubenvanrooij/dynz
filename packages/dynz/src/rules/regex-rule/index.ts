import type { ErrorMessageFromRule, RuleFn, Schema } from "../../types";
import { isString } from "../../validate/validate-type";

export type RegexRule = {
  type: "regex";
  regex: string;
  code?: string | undefined;
  flags?: string | undefined;
};

export type RegexRuleErrorMessage = ErrorMessageFromRule<RegexRule>;

/**
 * Creates a regex pattern validation rule for string fields.
 *
 * Rules are validation constraints that are attached to schema fields.
 * They define what values are valid and produce validation errors when violated.
 *
 * @category Rule
 * @param regex - The regular expression pattern as a string
 * @param code - Optional custom error code for this validation
 * @returns A RegexRule that validates the string matches the pattern
 *
 * @example
 * // Validate phone number format
 * string({ rules: [regex('^\\d{3}-\\d{3}-\\d{4}$')] })
 *
 * @example
 * // Validate alphanumeric username
 * string({ rules: [regex('^[a-zA-Z0-9_]+$', 'invalid_username')] })
 *
 * @see {@link email} - Built-in email validation rule
 * @see {@link minLength} - Minimum length validation
 * @see {@link maxLength} - Maximum length validation
 */
export function regex(regex: string, flags?: string, code?: string): RegexRule {
  return { type: "regex", regex, code, flags };
}

export const regexRule: RuleFn<Schema, RegexRule, RegexRuleErrorMessage> = ({ rule, value }) => {
  if (!isString(value)) {
    throw new Error("regexRule expects a string value");
  }

  const regex = new RegExp(rule.regex, rule.flags);
  return regex.test(value)
    ? undefined
    : {
        code: "regex",
        regex: rule.regex,
        message: `The value ${value} does not match the regex ${rule.regex}`,
      };
};
