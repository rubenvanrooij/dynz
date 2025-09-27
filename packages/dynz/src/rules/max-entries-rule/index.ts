import { type Reference, unpackRef } from "../../reference";
import type { ObjectSchema } from "../../schemas";
import {
  type ErrorMessageFromRule,
  type ExtractResolvedRules,
  type OmitBaseErrorMessageProps,
  SchemaType,
  type ValidateRuleContext,
} from "../../types";

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
  const { value: max } = unpackRef(rule.max, path, context, SchemaType.NUMBER);

  if (max === undefined) {
    return undefined;
  }

  return Object.entries(value).length <= max
    ? undefined
    : {
        code: "max_entries",
        max: max,
        message: `The value ${value} for schema ${path} should have a maximum of ${max} entries`,
      };
}
