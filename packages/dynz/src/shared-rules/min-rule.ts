import { unpackRefValue } from "../resolve";
import type { NumberSchema } from "../schemas";
import {
  ErrorCode,
  type ExtractResolvedRules,
  type MinErrorMessage,
  type MinRule,
  type OmitBaseErrorMessageProps,
  type ValidateRuleContext,
} from "../types";
import { assertNumber } from "../validate";

export function minRule<T extends NumberSchema>({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<T, Extract<ExtractResolvedRules<T>, MinRule>>):
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
        message: `The value ${value} for schema ${path} should be at least ${compareTo}`,
      };
}
