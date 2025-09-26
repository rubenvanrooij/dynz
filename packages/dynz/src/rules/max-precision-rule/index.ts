import { type Reference, unpackRefValue } from "../../reference";
import type { NumberSchema } from "../../schemas/number/types";
import type { ErrorMessageFromRule, OmitBaseErrorMessageProps, ValidateRuleContext } from "../../types";
import { assertNumber } from "../../validate";

export type MaxPrecisionRule<T extends number | Reference = number | Reference> = {
  type: "max_precision";
  maxPrecision: T;
  code?: string | undefined;
};

export type MaxPrecisionRuleErrorMessage = ErrorMessageFromRule<MaxPrecisionRule>;

export function maxPrecision<T extends number | Reference>(maxPrecision: T, code?: string): MaxPrecisionRule<T> {
  return { maxPrecision, type: "max_precision", code };
}

export function maxPrecisionRule({
  value,
  rule,
  path,
  context,
}: ValidateRuleContext<NumberSchema, MaxPrecisionRule>):
  | OmitBaseErrorMessageProps<MaxPrecisionRuleErrorMessage>
  | undefined {
  const maxPrecision = assertNumber(unpackRefValue(rule.maxPrecision, path, context));
  const precision = getPrecision(value);
  return maxPrecision >= precision
    ? undefined
    : {
        code: "max_precision",
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
