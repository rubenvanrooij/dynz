import { unpackRefValue } from "../resolve";
import type { FileSchema } from "../schemas";
import {
  ErrorCode,
  type ExtractResolvedRules,
  type MinSizeErrorMessage,
  type MinSizeRule,
  type OmitBaseErrorMessageProps,
  type ValidateRuleContext,
} from "../types";
import { assertNumber } from "../validate";

export function minSizeRule<T extends FileSchema>({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<T, Extract<ExtractResolvedRules<T>, MinSizeRule>>):
  | OmitBaseErrorMessageProps<MinSizeErrorMessage>
  | undefined {
  const min = unpackRefValue(rule.min, path, context);

  if (min === undefined) {
    return undefined;
  }

  const compareTo = assertNumber(min);
  return value.size >= compareTo
    ? undefined
    : {
        code: ErrorCode.MIN_SIZE,
        min: compareTo,
        message: `The value ${value} for schema ${path} should have at least a size of ${compareTo}`,
      };
}
