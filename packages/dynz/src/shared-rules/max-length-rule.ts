import { unpackRefValue } from "../resolve";
import type { ArraySchema, StringSchema } from "../schemas";
import {
  ErrorCode,
  type ExtractResolvedRules,
  type MaxLengthErrorMessage,
  type MaxLengthRule,
  type OmitBaseErrorMessageProps,
  type ValidateRuleContext,
} from "../types";
import { assertNumber } from "../validate";

export function maxLengthRule<T extends StringSchema | ArraySchema<never>>({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<T, Extract<ExtractResolvedRules<T>, MaxLengthRule>>):
  | OmitBaseErrorMessageProps<MaxLengthErrorMessage>
  | undefined {
  const max = unpackRefValue(rule.max, path, context);

  if (max === undefined) {
    return undefined;
  }

  const compareTo = assertNumber(max);
  return value.length <= compareTo
    ? undefined
    : {
        code: ErrorCode.MAX_LENGTH,
        max: compareTo,
        message: `The value ${value} for schema ${path} should have a maximum length of ${compareTo}`,
      };
}
