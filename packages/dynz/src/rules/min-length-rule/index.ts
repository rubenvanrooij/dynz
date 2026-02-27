import { type ParamaterValue, resolveExpected } from "../../functions";
import type { ArraySchema, StringSchema } from "../../schemas";
import { type ErrorMessageFromRule, type ExtractResolvedRules, type RuleFn, SchemaType } from "../../types";

export type MinLengthRule<T extends ParamaterValue<number> = ParamaterValue<number>> = {
  type: "min_length";
  min: T;
  code?: string | undefined;
};

export type MinLengthRuleErrorMessage = ErrorMessageFromRule<MinLengthRule, number, "min">;

export function minLength<T extends ParamaterValue<number> = ParamaterValue<number>>(
  min: T,
  code?: string
): MinLengthRule<T> {
  return { min, type: "min_length", code };
}

type AllowedSchemas = StringSchema | ArraySchema<never>;

export const minLengthRule: RuleFn<
  AllowedSchemas,
  Extract<ExtractResolvedRules<AllowedSchemas>, MinLengthRule>,
  MinLengthRuleErrorMessage
> = ({ rule, value, path, context }) => {
  const min = resolveExpected(rule.min, path, context, SchemaType.NUMBER);

  if (min === undefined) {
    return undefined;
  }

  return value.length >= min
    ? undefined
    : {
        code: "min_length",
        min: min,
        message: `The value ${value} for schema ${path} should have at least a length of ${min}`,
      };
};
