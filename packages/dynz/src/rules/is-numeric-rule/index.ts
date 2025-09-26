import type { StringSchema } from "../../schemas/string/types";
import type { ErrorMessageFromRule, OmitBaseErrorMessageProps, ValidateRuleContext } from "../../types";

export type IsNumericRule = {
  type: "is_numeric";
  code?: string | undefined;
};

export type IsNumericRuleErrorMessage = ErrorMessageFromRule<IsNumericRule>;

export function isNumeric(code?: string): IsNumericRule {
  return { type: "is_numeric", code };
}

export function isNumericRule({
  value,
}: ValidateRuleContext<StringSchema, IsNumericRule>): OmitBaseErrorMessageProps<IsNumericRuleErrorMessage> | undefined {
  return !Number.isNaN(value) && !Number.isNaN(+value)
    ? undefined
    : {
        code: "is_numeric",
        message: `The value ${value} is not a valid numeric value`,
      };
}
