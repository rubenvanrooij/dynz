import { type ParamaterValue, resolveExpected } from "../../functions";
import type { NumberSchema } from "../../schemas";
import { type ErrorMessageFromRule, type ExtractResolvedRules, type RuleFn, SchemaType } from "../../types";

export type MaxRule<T extends ParamaterValue<number> = ParamaterValue<number>> = {
  type: "max";
  max: T;
  code?: string | undefined;
};

export type MaxRuleErrorMessage = ErrorMessageFromRule<MaxRule, number, "max">;

export function max<T extends ParamaterValue<number>>(max: T, code?: string): MaxRule<T> {
  return { max, type: "max", code };
}

export const maxRule: RuleFn<
  NumberSchema,
  Extract<ExtractResolvedRules<NumberSchema>, MaxRule>,
  MaxRuleErrorMessage
> = ({ rule, value, path, context }) => {
  const max = resolveExpected(rule.max, path, context, SchemaType.NUMBER);

  if (max === undefined) {
    return undefined;
  }

  return value <= max
    ? undefined
    : {
        code: "max",
        max,
        message: `The value ${value} for schema ${path} should have a maximum of ${max}`,
      };
};
