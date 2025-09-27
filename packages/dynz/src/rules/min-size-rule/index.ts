import { type Reference, unpackRef } from "../../reference";
import type { FileSchema } from "../../schemas";
import { type ErrorMessageFromRule, type ExtractResolvedRules, type RuleFn, SchemaType } from "../../types";

export type MinSizeRule<T extends number | Reference = number | Reference> = {
  type: "min_size";
  min: T;
  code?: string | undefined;
};

export type MinSizeRuleErrorMessage = ErrorMessageFromRule<MinSizeRule>;

export function minSize<T extends number | Reference>(min: T, code?: string): MinSizeRule<T> {
  return { min, type: "min_size", code };
}

export const minSizeRule: RuleFn<
  FileSchema,
  Extract<ExtractResolvedRules<FileSchema>, MinSizeRule>,
  MinSizeRuleErrorMessage
> = ({ rule, value, path, context }) => {
  const { value: min } = unpackRef(rule.min, path, context, SchemaType.NUMBER);

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
