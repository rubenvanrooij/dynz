import type { StringSchema } from "../../schemas/string/types";
import type { ErrorMessageFromRule, RuleFn } from "../../types";

export type EmailRule = {
  type: "email";
  code?: string | undefined;
};

export type EmailRuleErrorMessage = ErrorMessageFromRule<EmailRule>;

/**
 * Creates an email validation rule for string fields.
 *
 * Rules are validation constraints that are attached to schema fields.
 * They define what values are valid and produce validation errors when violated.
 *
 * @category Rule
 * @param code - Optional custom error code for this validation
 * @returns An EmailRule that validates the string is a valid email format
 *
 * @example
 * // Basic email validation
 * string({ rules: [email()] })
 *
 * @example
 * // With custom error code
 * string({ rules: [email('invalid_email_format')] })
 *
 * @see {@link regex} - For custom pattern validation
 * @see {@link minLength} - For minimum length validation
 */
export function email(code?: string): EmailRule {
  return { type: "email", code };
}

const EMAIL_REGEX = /^(?!\.)(?!.*\.\.)([a-z0-9_'+\-.]*)[a-z0-9_'+-]@([a-z0-9][a-z0-9-]*\.)+[a-z]{2,}$/i;

export const emailRule: RuleFn<StringSchema, EmailRule, EmailRuleErrorMessage> = ({ value }) => {
  return EMAIL_REGEX.test(value)
    ? undefined
    : {
        code: "email",
        message: `The value ${value} is not a valid email address`,
      };
};
