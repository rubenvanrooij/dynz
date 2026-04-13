import { type ParamaterValue, resolve } from "../../functions";
import type { ErrorMessageFromRule, ExtractResolvedRules, RuleFn, Schema, ValueType } from "../../types";
import { isNumber, isString } from "../../validate/validate-type";

export type OneOfRule<T extends ParamaterValue[] = ParamaterValue[]> = {
  type: "one_of";
  values: T;
  code?: string | undefined;
};

export type OneOfRuleErrorMessage = ErrorMessageFromRule<OneOfRule, (ValueType | undefined)[], "values">;

export function oneOf<T extends ParamaterValue[]>(values: T, code?: string): OneOfRule<T> {
  return { values, type: "one_of", code };
}

export const oneOfRule: RuleFn<Schema, Extract<ExtractResolvedRules<Schema>, OneOfRule>, OneOfRuleErrorMessage> = ({
  value,
  rule,
  path,
  context,
}) => {
  if (!isString(value) && !isNumber(value)) {
    throw new Error("oneOfRule expects a number or string value");
  }

  const resolvedValues = rule.values.map((v) => resolve(v, path, context));

  return resolvedValues.some((v) => v === value)
    ? undefined
    : {
        code: "one_of",
        values: resolvedValues,
        message: `The value ${value} is not one of ${rule.values}`,
      };
};
