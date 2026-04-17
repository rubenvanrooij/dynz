import { type ParamaterValue, resolveExpected } from "../../functions";
import {
  type ErrorMessageFromRule,
  type ExtractResolvedRules,
  type RuleFn,
  type Schema,
  SchemaType,
} from "../../types";
import { isFile } from "../../validate/validate-type";

export type MinSizeRule<T extends ParamaterValue<number> = ParamaterValue<number>> = {
  type: "min_size";
  min: T;
  code?: string | undefined;
};

export type MinSizeRuleErrorMessage = ErrorMessageFromRule<MinSizeRule, number, "min">;

export function buildMinSizeRule<T extends ParamaterValue<number> = ParamaterValue<number>>(
  min: T,
  code?: string
): MinSizeRule<T> {
  return { min, type: "min_size", code };
}

export const minSizeRule: RuleFn<
  Schema,
  Extract<ExtractResolvedRules<Schema>, MinSizeRule>,
  MinSizeRuleErrorMessage
> = ({ rule, value, path, context }) => {
  if (!isFile(value)) {
    throw new Error("minSizeRule expects a file value");
  }

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
