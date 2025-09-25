import { unpackRefValue } from "../resolve";
import type { ArraySchema, StringSchema } from "../schemas";
import {
  ErrorCode,
  type ExtractResolvedRules,
  type MinLengthErrorMessage,
  type MinLengthRule,
  type OmitBaseErrorMessageProps,
  type ValidateRuleContext,
} from "../types";
import { assertNumber } from "../validate";

export function minLengthRule<T extends StringSchema | ArraySchema<never>>({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<T, Extract<ExtractResolvedRules<T>, MinLengthRule>>):
  | OmitBaseErrorMessageProps<MinLengthErrorMessage>
  | undefined {
  const min = unpackRefValue(rule.min, path, context);

  if (min === undefined) {
    return undefined;
  }

  const compareTo = assertNumber(min);
  return value.length >= compareTo
    ? undefined
    : {
        code: ErrorCode.MIN_LENGTH,
        min: compareTo,
        message: `The value ${value} for schema ${path} should have at least a length of ${compareTo}`,
      };
}
