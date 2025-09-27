import { type Reference, unpackRef } from "../../reference";
import type { FileSchema } from "../../schemas";
import { type ErrorMessageFromRule, type ExtractResolvedRules, type RuleFn, SchemaType } from "../../types";

export type MaxSizeRule<T extends number | Reference = number | Reference> = {
  type: "max_size";
  max: T;
  code?: string | undefined;
};

export type MaxSizeRuleErrorMessage = ErrorMessageFromRule<MaxSizeRule>;

export function maxSize<T extends number | Reference>(max: T, code?: string): MaxSizeRule<T> {
  return { max, type: "max_size", code };
}

export const maxSizeRule: RuleFn<
  FileSchema,
  Extract<ExtractResolvedRules<FileSchema>, MaxSizeRule>,
  MaxSizeRuleErrorMessage
> = ({ rule, value, path, context }) => {
  const { value: max } = unpackRef(rule.max, path, context, SchemaType.NUMBER);

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
