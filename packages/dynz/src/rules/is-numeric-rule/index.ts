import type { ErrorMessageFromRule, RuleFn, Schema } from "../../types";
import { isString } from "../../validate/validate-type";

export type IsNumericRule = {
  type: "is_numeric";
  code?: string | undefined;
};

export type IsNumericRuleErrorMessage = ErrorMessageFromRule<IsNumericRule>;

export function isNumeric(code?: string): IsNumericRule {
  return { type: "is_numeric", code };
}

export const isNumericRule: RuleFn<Schema, IsNumericRule, IsNumericRuleErrorMessage> = ({ value }) => {
  if (!isString(value)) {
    throw new Error("emailRule expects a string value");
  }

  return value !== "" && !Number.isNaN(+value)
    ? undefined
    : {
        code: "is_numeric",
        message: `The value ${value} is not a valid numeric value`,
      };
};
