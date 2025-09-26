import { type Reference, unpackRefValue } from "../reference";
import type { ObjectSchema } from "../schemas";
import type {
  ErrorMessageFromRule,
  ExtractResolvedRules,
  OmitBaseErrorMessageProps,
  ValidateRuleContext,
} from "../types";
import { assertNumber } from "../validate";

export type MaxEntriesRule<T extends number | Reference = number | Reference> = {
  type: "max_entries";
  max: T;
  code?: string | undefined;
};

export type MaxEntriesRuleErrorMessage = ErrorMessageFromRule<MaxEntriesRule>;

export function maxEntries<T extends number | Reference>(max: T, code?: string): MaxEntriesRule<T> {
  return { max, type: "max_entries", code };
}

export function maxEntriesRule<T extends ObjectSchema<never>>({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<T, Extract<ExtractResolvedRules<T>, MaxEntriesRule>>):
  | OmitBaseErrorMessageProps<MaxEntriesRuleErrorMessage>
  | undefined {
  const min = unpackRefValue(rule.max, path, context);

  if (min === undefined) {
    return undefined;
  }

  const compareTo = assertNumber(min);
  return Object.entries(value).length <= compareTo
    ? undefined
    : {
        code: "max_entries",
        max: compareTo,
        message: `The value ${value} for schema ${path} should have a maximum of ${compareTo} entries`,
      };
}
