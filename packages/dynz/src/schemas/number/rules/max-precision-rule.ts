import { unpackRefValue } from "../../../resolve";
import { ErrorCode, type MaxPrecisionRule, type ValidateRuleContext } from "../../../types";
import { assertNumber } from "../../../validate";
import type { NumberSchema } from "../types";

export function maxPrecisionRule({ value, rule, path, context }: ValidateRuleContext<NumberSchema, MaxPrecisionRule>) {
  const maxPrecision = assertNumber(unpackRefValue(rule.max, path, context));
  const precision = getPrecision(value);
  return maxPrecision >= precision
    ? undefined
    : {
        code: ErrorCode.MAX_PRECISION,
        maxPrecision,
        message: `The value ${value} for schema ${path} has a precision of ${precision}, which is greater than the maximum precision of ${maxPrecision}`,
      };
}

/**
 * Returns the precision of a number
 * e.g. 1.23 resolves in a precision of 2
 *
 * @param value the number value the precision needs to be determined for
 * @returns the precision
 */
function getPrecision(value: number): number {
  return (value.toString().split(".")[1] || "").length;
}
