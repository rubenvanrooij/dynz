import { type ParamaterValue, resolveExpected } from "../../functions";
import type { ObjectSchema } from "../../schemas";
import {
  type ErrorMessageFromRule,
  type ExtractResolvedRules,
  type RuleFn,
  type Schema,
  SchemaType,
} from "../../types";
import { isObject } from "../../validate/validate-type";

export type MinEntriesRule<T extends ParamaterValue<number> = ParamaterValue<number>> = {
  type: "min_entries";
  min: T;
  code?: string | undefined;
};

export type MinEntriesRuleErrorMessage = ErrorMessageFromRule<MinEntriesRule, number, "min">;

export function minEntries<T extends ParamaterValue<number> = ParamaterValue<number>>(
  min: T,
  code?: string
): MinEntriesRule<T> {
  return { min, type: "min_entries", code };
}

export const minEntriesRule: RuleFn<
  Schema,
  Extract<ExtractResolvedRules<Schema>, MinEntriesRule>,
  MinEntriesRuleErrorMessage
> = ({ rule, value, path, context }) => {
  if (!isObject(value)) {
    throw new Error("minEntriesRule expects a object value");
  }

  const min = resolveExpected(rule.min, path, context, SchemaType.NUMBER);

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
