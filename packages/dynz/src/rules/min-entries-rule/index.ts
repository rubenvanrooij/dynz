import { type Reference, unpackRefValue } from "../../reference";
import type { ObjectSchema } from "../../schemas";
import type {
  ErrorMessageFromRule,
  ExtractResolvedRules,
  OmitBaseErrorMessageProps,
  ValidateRuleContext,
} from "../../types";
import { assertNumber } from "../../validate";

export type MinEntriesRule<T extends number | Reference = number | Reference> = {
  type: "min_entries";
  min: T;
  code?: string | undefined;
};

export type MinEntriesRuleErrorMessage = ErrorMessageFromRule<MinEntriesRule>;

export function minEntries<T extends number | Reference>(min: T, code?: string): MinEntriesRule<T> {
  return { min, type: "min_entries", code };
}

export function minEntriesRule<T extends ObjectSchema<never>>({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<T, Extract<ExtractResolvedRules<T>, MinEntriesRule>>):
  | OmitBaseErrorMessageProps<MinEntriesRuleErrorMessage>
  | undefined {
  const min = unpackRefValue(rule.min, path, context);

  if (min === undefined) {
    return undefined;
  }

  const compareTo = assertNumber(min);
  return Object.entries(value).length >= compareTo
    ? undefined
    : {
        code: "min_entries",
        min: compareTo,
        message: `The value ${value} for schema ${path} should have at least ${compareTo} entries`,
      };
}
