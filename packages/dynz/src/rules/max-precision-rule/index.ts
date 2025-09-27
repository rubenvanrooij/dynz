import { type Reference, unpackRef } from "../../reference";
import type { NumberSchema } from "../../schemas/number/types";
import type { ErrorMessageFromRule, RuleFn } from "../../types";

export type MaxPrecisionRule<T extends number | Reference = number | Reference> = {
  type: "max_precision";
  maxPrecision: T;
  code?: string | undefined;
};

export type MaxPrecisionRuleErrorMessage = ErrorMessageFromRule<MaxPrecisionRule>;

export function maxPrecision<T extends number | Reference>(maxPrecision: T, code?: string): MaxPrecisionRule<T> {
  return { maxPrecision, type: "max_precision", code };
}

export const maxPrecisionRule: RuleFn<NumberSchema, MaxPrecisionRule, MaxPrecisionRuleErrorMessage> = ({
  value,
  rule,
  path,
  schema,
  context,
}) => {
  const { value: maxPrecision } = unpackRef(rule.maxPrecision, path, context, schema.type);

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
