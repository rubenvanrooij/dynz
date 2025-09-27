import { type Reference, unpackRef } from "../../reference";
import type { ObjectSchema } from "../../schemas";
import { type ErrorMessageFromRule, type ExtractResolvedRules, type RuleFn, SchemaType } from "../../types";

export type MaxEntriesRule<T extends number | Reference = number | Reference> = {
  type: "max_entries";
  max: T;
  code?: string | undefined;
};

export type MaxEntriesRuleErrorMessage = ErrorMessageFromRule<MaxEntriesRule>;

export function maxEntries<T extends number | Reference>(max: T, code?: string): MaxEntriesRule<T> {
  return { max, type: "max_entries", code };
}

type AllowedSchemas = ObjectSchema<never>;

export const maxEntriesRule: RuleFn<
  AllowedSchemas,
  Extract<ExtractResolvedRules<AllowedSchemas>, MaxEntriesRule>,
  MaxEntriesRuleErrorMessage
> = ({ rule, value, path, context }) => {
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
};
