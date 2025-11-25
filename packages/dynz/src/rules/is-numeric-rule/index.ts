import type { StringSchema } from "../../schemas/string/types";
import type { ErrorMessageFromRule, RuleFn } from "../../types";

export type IsNumericRule = {
  type: "is_numeric";
  code?: string | undefined;
};

export type IsNumericRuleErrorMessage = ErrorMessageFromRule<IsNumericRule>;

export function isNumeric(code?: string): IsNumericRule {
  return { type: "is_numeric", code };
}

export const isNumericRule: RuleFn<StringSchema, IsNumericRule, IsNumericRuleErrorMessage> = ({ value }) => {
  return value !== "" && !Number.isNaN(+value)
    ? undefined
    : {
        code: "is_numeric",
        message: `The value ${value} is not a valid numeric value`,
      };
};
