import { type ParamaterValue, resolveExpected } from "../../functions";
import {
  type ErrorMessageFromRule,
  type ExtractResolvedRules,
  type RuleFn,
  type Schema,
  SchemaType,
} from "../../types";
import { isFile } from "../../validate/validate-type";

export type MaxSizeRule<T extends ParamaterValue<number> = ParamaterValue<number>> = {
  type: "max_size";
  max: T;
  code?: string | undefined;
};

export type MaxSizeRuleErrorMessage = ErrorMessageFromRule<MaxSizeRule, number, "max">;

export function maxSize<T extends ParamaterValue<number> = ParamaterValue<number>>(
  max: T,
  code?: string
): MaxSizeRule<T> {
  return { max, type: "max_size", code };
}

export const maxSizeRule: RuleFn<
  Schema,
  Extract<ExtractResolvedRules<Schema>, MaxSizeRule>,
  MaxSizeRuleErrorMessage
> = ({ rule, value, path, context }) => {
  if (!isFile(value)) {
    throw new Error("maxSizeRule expects a file value");
  }

  const max = resolveExpected(rule.max, path, context, SchemaType.NUMBER);

  if (max === undefined) {
    return undefined;
  }

  return value.size <= max
    ? undefined
    : {
        code: "max_size",
        max,
        message: `The value ${value} for schema ${path} should have a maximum size of ${max}`,
      };
};
