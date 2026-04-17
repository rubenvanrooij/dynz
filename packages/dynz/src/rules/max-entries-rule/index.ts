import { type ParamaterValue, resolveExpected } from "../../functions";
import {
  type ErrorMessageFromRule,
  type ExtractResolvedRules,
  type RuleFn,
  type Schema,
  SchemaType,
} from "../../types";
import { isObject } from "../../validate/validate-type";

export type MaxEntriesRule<T extends ParamaterValue<number> = ParamaterValue<number>> = {
  type: "max_entries";
  max: T;
  code?: string | undefined;
};

export type MaxEntriesRuleErrorMessage = ErrorMessageFromRule<MaxEntriesRule, number, "max">;

export function buildMaxEntriesRule<T extends ParamaterValue<number> = ParamaterValue<number>>(
  max: T,
  code?: string
): MaxEntriesRule<T> {
  return { max, type: "max_entries", code };
}

export const maxEntriesRule: RuleFn<
  Schema,
  Extract<ExtractResolvedRules<Schema>, MaxEntriesRule>,
  MaxEntriesRuleErrorMessage
> = ({ rule, value, path, context }) => {
  if (!isObject(value)) {
    throw new Error("maxEntriesRule expects a object value");
  }

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
