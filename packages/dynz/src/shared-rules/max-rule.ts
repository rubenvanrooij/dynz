import { unpackRefValue } from "../resolve";
import type { NumberSchema } from "../schemas";
import {
  ErrorCode,
  type ExtractResolvedRules,
  type MaxErrorMessage,
  type MaxRule,
  type OmitBaseErrorMessageProps,
  type ValidateRuleContext,
} from "../types";
import { assertNumber } from "../validate";

export function maxRule<T extends NumberSchema>({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<T, Extract<ExtractResolvedRules<T>, MaxRule>>):
  | OmitBaseErrorMessageProps<MaxErrorMessage>
  | undefined {
  const max = unpackRefValue(rule.max, path, context);

  if (max === undefined) {
    return undefined;
  }

  const compareTo = assertNumber(max);
  return value <= compareTo
    ? undefined
    : {
        code: ErrorCode.MAX,
        max: compareTo,
        message: `The value ${value} for schema ${path} shuld have a maximum of ${compareTo}`,
      };
}
