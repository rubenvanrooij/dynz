import { type ParamaterValue, resolveExpected } from "../../functions";
import type { FileSchema } from "../../schemas";
import { type ErrorMessageFromRule, type ExtractResolvedRules, type RuleFn, SchemaType } from "../../types";

export type MinSizeRule<T extends ParamaterValue<number> = ParamaterValue<number>> = {
  type: "min_size";
  min: T;
  code?: string | undefined;
};

export type MinSizeRuleErrorMessage = ErrorMessageFromRule<MinSizeRule, number, "min">;

export function minSize<T extends ParamaterValue<number> = ParamaterValue<number>>(
  min: T,
  code?: string
): MinSizeRule<T> {
  return { min, type: "min_size", code };
}

export const minSizeRule: RuleFn<
  FileSchema,
  Extract<ExtractResolvedRules<FileSchema>, MinSizeRule>,
  MinSizeRuleErrorMessage
> = ({ rule, value, path, context }) => {
  const min = resolveExpected(rule.min, path, context, SchemaType.NUMBER);

  if (min === undefined) {
    return undefined;
  }

  return value.size >= min
    ? undefined
    : {
        code: "min_size",
        min: min,
        message: `The value ${value} for schema ${path} should have at least a size of ${min}`,
      };
};
