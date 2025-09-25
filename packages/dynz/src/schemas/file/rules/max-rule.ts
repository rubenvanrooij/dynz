import { unpackRefValue } from "../../../resolve";
import { ErrorCode, type MaxRule, type Reference, type ValidateRuleContext } from "../../../types";
import { assertNumber } from "../../../validate";
import type { FileSchema } from "../types";

export function maxRule({ rule, value, path, context }: ValidateRuleContext<FileSchema, MaxRule<number | Reference>>) {
  const max = unpackRefValue(rule.max, path, context);

  if (max === undefined) {
    return undefined;
  }

  const compareTo = assertNumber(max);
  return value.size <= compareTo
    ? undefined
    : {
        code: ErrorCode.MAX,
        max: compareTo,
        message: `The value ${value} for schema ${path} should have a maximum of ${compareTo} bytes`,
      };
}
