import { unpackRefValue } from "../../../resolve";
import { ErrorCode, type MaxRule, type Reference, type ValidateRuleContext } from "../../../types";
import { assertNumber } from "../../../validate";
import type { StringSchema } from "../types";

export function maxRule({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<StringSchema, MaxRule<number | Reference>>) {
  const max = unpackRefValue(rule.max, path, context);

  if (max === undefined) {
    return undefined;
  }

  const compareTo = assertNumber(max);
  return value.length <= compareTo
    ? undefined
    : {
        code: ErrorCode.MAX,
        max: compareTo,
        message: `The value ${value} for schema ${path} shuld have a maximum of ${compareTo} characters`,
      };
}
