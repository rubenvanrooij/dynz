import { unpackRefValue } from "../resolve";
import type { ObjectSchema } from "../schemas";
import {
  ErrorCode,
  type ExtractResolvedRules,
  type MaxEntriesErrorMessage,
  type MaxEntriesRule,
  type OmitBaseErrorMessageProps,
  type ValidateRuleContext,
} from "../types";
import { assertNumber } from "../validate";

export function maxEntriesRule<T extends ObjectSchema<never>>({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<T, Extract<ExtractResolvedRules<T>, MaxEntriesRule>>):
  | OmitBaseErrorMessageProps<MaxEntriesErrorMessage>
  | undefined {
  const min = unpackRefValue(rule.max, path, context);

  if (min === undefined) {
    return undefined;
  }

  const compareTo = assertNumber(min);
  return Object.entries(value).length <= compareTo
    ? undefined
    : {
        code: ErrorCode.MAX_ENTRIES,
        max: compareTo,
        message: `The value ${value} for schema ${path} should have a maximum of ${compareTo} entries`,
      };
}
