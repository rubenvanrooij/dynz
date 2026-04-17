import { type ParamaterValue, resolveExpected } from "../../functions";
import {
  type ErrorMessageFromRule,
  type ExtractResolvedRules,
  type RuleFn,
  type Schema,
  SchemaType,
} from "../../types";
import { isDate } from "../../validate/validate-type";

export type AfterRule<T extends ParamaterValue<Date> = ParamaterValue<Date>> = {
  type: "after";
  after: T;
  code?: string | undefined;
};

export type AfterRuleErrorMessage = ErrorMessageFromRule<AfterRule, Date, "after">;

export function buildAfterRule<T extends ParamaterValue<Date>>(after: T, code?: string): AfterRule<T> {
  return { after, type: "after", code };
}

export function isAfter(value: Date, after: Date): boolean {
  return value.getTime() > after.getTime();
}

export const afterRule: RuleFn<Schema, Extract<ExtractResolvedRules<Schema>, AfterRule>, AfterRuleErrorMessage> = ({
  rule,
  value,
  path,
  context,
}) => {
  if (!isDate(value)) {
    throw new Error("afterRule expects a date value");
  }

  const after = resolveExpected(rule.after, path, context, SchemaType.DATE);

  if (after === undefined) {
    return undefined;
  }

  return isAfter(value, after)
    ? undefined
    : {
        code: "after",
        after,
        message: `The value ${value} for schema ${path} is before ${after}`,
      };
};
