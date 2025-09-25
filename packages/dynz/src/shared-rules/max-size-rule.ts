import { unpackRefValue } from "../resolve";
import type { FileSchema } from "../schemas";
import {
  ErrorCode,
  type ExtractResolvedRules,
  type MaxSizeErrorMessage,
  type MaxSizeRule,
  type OmitBaseErrorMessageProps,
  type ValidateRuleContext,
} from "../types";
import { assertNumber } from "../validate";

export function maxSizeRule<T extends FileSchema>({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<T, Extract<ExtractResolvedRules<T>, MaxSizeRule>>):
  | OmitBaseErrorMessageProps<MaxSizeErrorMessage>
  | undefined {
  const min = unpackRefValue(rule.max, path, context);

  if (min === undefined) {
    return undefined;
  }

  const compareTo = assertNumber(min);
  return value.size <= compareTo
    ? undefined
    : {
        code: ErrorCode.MAX_SIZE,
        max: compareTo,
        message: `The value ${value} for schema ${path} should have a maximum size of ${compareTo}`,
      };
}
