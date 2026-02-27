import { type ParamaterValue, resolveExpected } from "../../functions";
import type { ObjectSchema } from "../../schemas";
import { type ErrorMessageFromRule, type ExtractResolvedRules, type RuleFn, SchemaType } from "../../types";

export type MaxEntriesRule<T extends ParamaterValue<number> = ParamaterValue<number>> = {
  type: "max_entries";
  max: T;
  code?: string | undefined;
};

export type MaxEntriesRuleErrorMessage = ErrorMessageFromRule<MaxEntriesRule, number, "max">;

export function maxEntries<T extends ParamaterValue<number> = ParamaterValue<number>>(
  max: T,
  code?: string
): MaxEntriesRule<T> {
  return { max, type: "max_entries", code };
}

type AllowedSchemas = ObjectSchema<never>;

export const maxEntriesRule: RuleFn<
  AllowedSchemas,
  Extract<ExtractResolvedRules<AllowedSchemas>, MaxEntriesRule>,
  MaxEntriesRuleErrorMessage
> = ({ rule, value, path, context }) => {
  const max = resolveExpected(rule.max, path, context, SchemaType.NUMBER);

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
