import { ErrorCode, type IsNumericRule, type ValidateRuleContext } from "../../../types";
import type { StringSchema } from "../types";

export function isNumericRule({ value }: ValidateRuleContext<StringSchema, IsNumericRule>) {
  return !Number.isNaN(value) && !Number.isNaN(+value)
    ? undefined
    : {
        code: ErrorCode.IS_NUMERIC,
        message: `The value ${value} is not a valid numeric value`,
      };
}
