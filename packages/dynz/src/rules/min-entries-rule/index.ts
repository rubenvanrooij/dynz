import { type Reference, unpackRef } from "../../reference";
import type { ObjectSchema } from "../../schemas";
import { type ErrorMessageFromRule, type ExtractResolvedRules, type RuleFn, SchemaType } from "../../types";

export type MinEntriesRule<T extends number | Reference = number | Reference> = {
  type: "min_entries";
  min: T;
  code?: string | undefined;
};

export type MinEntriesRuleErrorMessage = ErrorMessageFromRule<MinEntriesRule>;

export function minEntries<T extends number | Reference>(min: T, code?: string): MinEntriesRule<T> {
  return { min, type: "min_entries", code };
}

export const minEntriesRule: RuleFn<
  ObjectSchema<never>,
  Extract<ExtractResolvedRules<ObjectSchema<never>>, MinEntriesRule>,
  MinEntriesRuleErrorMessage
> = ({ rule, value, path, context }) => {
  const { value: min } = unpackRef(rule.min, path, context, SchemaType.NUMBER);

  if (min === undefined) {
    return undefined;
  }

  return Object.entries(value).length >= min
    ? undefined
    : {
        code: "min_entries",
        min: min,
        message: `The value ${value} for schema ${path} should have at least ${min} entries`,
      };
};
