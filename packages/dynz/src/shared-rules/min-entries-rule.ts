import { unpackRefValue } from "../resolve";
import type { ObjectSchema } from "../schemas";
import {
  ErrorCode,
  type ExtractResolvedRules,
  type MinEntriesErrorMessage,
  type MinEntriesRule,
  type OmitBaseErrorMessageProps,
  type ValidateRuleContext,
} from "../types";
import { assertNumber } from "../validate";

export function minEntriesRule<T extends ObjectSchema<never>>({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<T, Extract<ExtractResolvedRules<T>, MinEntriesRule>>):
  | OmitBaseErrorMessageProps<MinEntriesErrorMessage>
  | undefined {
  const min = unpackRefValue(rule.min, path, context);

  if (min === undefined) {
    return undefined;
  }

  const compareTo = assertNumber(min);
  return Object.entries(value).length >= compareTo
    ? undefined
    : {
        code: ErrorCode.MIN_ENTRIES,
        min: compareTo,
        message: `The value ${value} for schema ${path} should have at least ${compareTo} entries`,
      };
}
