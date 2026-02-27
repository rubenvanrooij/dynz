import { type ParamaterValue, resolveExpected } from "../../functions";
import type { ArraySchema, StringSchema } from "../../schemas";
import { type ErrorMessageFromRule, type ExtractResolvedRules, type RuleFn, SchemaType } from "../../types";

export type MaxLengthRule<T extends ParamaterValue<number> = ParamaterValue<number>> = {
  type: "max_length";
  max: T;
  code?: string | undefined;
};

export type MaxLengthRuleErrorMessage = ErrorMessageFromRule<MaxLengthRule, number, "max">;

export function maxLength<T extends ParamaterValue<number> = ParamaterValue<number>>(
  max: T,
  code?: string
): MaxLengthRule<T> {
  return { max, type: "max_length", code };
}

type AllowedSchemas = StringSchema | ArraySchema<never>;

export const maxLengthRule: RuleFn<
  AllowedSchemas,
  Extract<ExtractResolvedRules<AllowedSchemas>, MaxLengthRule>,
  MaxLengthRuleErrorMessage
> = ({ rule, value, path, context }) => {
  const max = resolveExpected(rule.max, path, context, SchemaType.NUMBER);

  if (max === undefined) {
    return undefined;
  }

  return value.length <= max
    ? undefined
    : {
        code: "max_length",
        max,
        message: `The value ${value} for schema ${path} should have a maximum length of ${max}`,
      };
};
