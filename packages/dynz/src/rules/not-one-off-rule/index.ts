import { type ParamaterValue, resolve } from "../../functions";
import type { ErrorMessageFromRule, ExtractResolvedRules, RuleFn, Schema, ValueType } from "../../types";
import { isNumber, isString } from "../../validate/validate-type";

export type NotOneOfRule<T extends ParamaterValue[] = ParamaterValue[]> = {
  type: "not_one_of";
  values: T;
  code?: string | undefined;
};

export type NotOneOfRuleErrorMessage = ErrorMessageFromRule<NotOneOfRule, (ValueType | undefined)[], "values">;

export function notOneOf<T extends ParamaterValue[]>(values: T, code?: string): NotOneOfRule<T> {
  return { values, type: "not_one_of", code };
}

export const notOneOfRule: RuleFn<
  Schema,
  Extract<ExtractResolvedRules<Schema>, NotOneOfRule>,
  NotOneOfRuleErrorMessage
> = ({ value, rule, path, context }) => {
  if (!isString(value) && !isNumber(value)) {
    throw new Error("notOneOfRule expects a number or string value");
  }

  const resolvedValues = rule.values.map((v) => resolve(v, path, context));

  return resolvedValues.every((v) => v !== value)
    ? undefined
    : {
        code: "not_one_of",
        values: resolvedValues,
        message: `The value ${value} is not one of ${rule.values}`,
      };
};
