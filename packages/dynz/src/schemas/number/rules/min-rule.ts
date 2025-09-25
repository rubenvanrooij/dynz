import { unpackRefValue } from "../../../resolve";
import type { OmitBaseErrorMessageProps, ValidateRuleContext } from "../../../types";
import { ErrorCode, type MinErrorMessage, type MinRule, type Reference } from "../../../types";
import { assertNumber } from "../../../validate";
import type { NumberSchema } from "../types";

export function minRule({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<NumberSchema, MinRule<number | Reference>>):
  | OmitBaseErrorMessageProps<MinErrorMessage>
  | undefined {
  const min = unpackRefValue(rule.min, path, context);

  if (min === undefined) {
    return undefined;
  }

  const compareTo = assertNumber(min);
  return value >= compareTo
    ? undefined
    : {
        code: ErrorCode.MIN,
        min: compareTo,
        message: `The value ${value} for schema ${path} shuld have at least ${compareTo} characters`,
      };
}
