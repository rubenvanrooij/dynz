import { type ParamaterValue, resolveExpected } from "../../functions";
import type { NumberSchema } from "../../schemas/number/types";
import { type ErrorMessageFromRule, type RuleFn, type Schema, SchemaType } from "../../types";
import { isNumber } from "../../validate/validate-type";

export type MaxPrecisionRule<T extends ParamaterValue<number> = ParamaterValue<number>> = {
  type: "max_precision";
  maxPrecision: T;
  code?: string | undefined;
};

export type MaxPrecisionRuleErrorMessage = ErrorMessageFromRule<MaxPrecisionRule, number, "maxPrecision">;

export function maxPrecision<T extends ParamaterValue<number> = ParamaterValue<number>>(
  maxPrecision: T,
  code?: string
): MaxPrecisionRule<T> {
  return { maxPrecision, type: "max_precision", code };
}

export const maxPrecisionRule: RuleFn<Schema, MaxPrecisionRule, MaxPrecisionRuleErrorMessage> = ({
  value,
  rule,
  path,
  context,
}) => {
  if (!isNumber(value)) {
    throw new Error("maxPrecisionRule expects a number value");
  }

  const maxPrecision = resolveExpected(rule.maxPrecision, path, context, SchemaType.NUMBER);

  if (maxPrecision === undefined) {
    return undefined;
  }

  const precision = getPrecision(value);
  return maxPrecision >= precision
    ? undefined
    : {
        code: "max_precision",
        maxPrecision,
        message: `The value ${value} for schema ${path} has a precision of ${precision}, which is greater than the maximum precision of ${maxPrecision}`,
      };
};

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
