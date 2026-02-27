import { type ParamaterValue, resolve } from "../../functions";
import type { NumberSchema, StringSchema } from "../../schemas";
import type { ErrorMessageFromRule, ExtractResolvedRules, RuleFn, ValueType } from "../../types";

export type OneOfRule<T extends ParamaterValue[] = ParamaterValue[]> = {
  type: "one_of";
  values: T;
  code?: string | undefined;
};

export type OneOfRuleErrorMessage = ErrorMessageFromRule<OneOfRule, (ValueType | undefined)[], "values">;

export function oneOf<T extends ParamaterValue[]>(values: T, code?: string): OneOfRule<T> {
  return { values, type: "one_of", code };
}

type AllowedSchemas = StringSchema | NumberSchema;

export const oneOfRule: RuleFn<
  AllowedSchemas,
  Extract<ExtractResolvedRules<AllowedSchemas>, OneOfRule>,
  OneOfRuleErrorMessage
> = ({ value, rule, path, context }) => {
  const resolvedValues = rule.values.map((v) => resolve(v, path, context));

  return resolvedValues.some((v) => v === value)
    ? undefined
    : {
        code: "one_of",
        values: resolvedValues,
        message: `The value ${value} is not one of ${rule.values}`,
      };
};
