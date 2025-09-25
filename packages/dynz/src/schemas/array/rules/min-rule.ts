import { unpackRefValue } from "../../../resolve";
import { ErrorCode, type MinRule, type Reference, type ValidateRuleContext } from "../../../types";
import { assertNumber } from "../../../validate";
import type { ArraySchema } from "../types";

export function minRule({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<ArraySchema<never>, MinRule<number | Reference>>) {
  const min = unpackRefValue(rule.min, path, context);

  if (min === undefined) {
    return undefined;
  }

  const compareTo = assertNumber(min);
  return value.length >= compareTo
    ? undefined
    : {
        code: ErrorCode.MIN,
        min: compareTo,
        message: `The value ${value} for schema ${path} should have at least ${compareTo} items`,
      };
}
