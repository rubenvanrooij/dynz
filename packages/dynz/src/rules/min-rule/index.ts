import { type ParamaterValue, resolveExpected } from "../../functions";
import type { NumberSchema } from "../../schemas";
import { type ErrorMessageFromRule, type ExtractResolvedRules, type RuleFn, SchemaType } from "../../types";

export type MinRule<T extends ParamaterValue<number> = ParamaterValue<number>> = {
  type: "min";
  min: T;
  code?: string | undefined;
};

export type MinRuleErrorMessage = ErrorMessageFromRule<MinRule, number, "min">;

export function min<T extends ParamaterValue<number>>(min: T, code?: string): MinRule<T> {
  return { min, type: "min", code };
}

export const minRule: RuleFn<
  NumberSchema,
  Extract<ExtractResolvedRules<NumberSchema>, MinRule>,
  MinRuleErrorMessage
> = ({ rule, value, path, context }) => {
  const min = resolveExpected(rule.min, path, context, SchemaType.NUMBER);

  if (min === undefined) {
    return undefined;
  }

  return value >= min
    ? undefined
    : {
        code: "min",
        min,
        message: `The value ${value} for schema ${path} should be at least ${min}`,
      };
};
