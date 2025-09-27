import { type Reference, unpackRef } from "../../reference";
import type { ArraySchema, StringSchema } from "../../schemas";
import {
  type ErrorMessageFromRule,
  type ExtractResolvedRules,
  type OmitBaseErrorMessageProps,
  SchemaType,
  type ValidateRuleContext,
} from "../../types";

export type MaxLengthRule<T extends number | Reference = number | Reference> = {
  type: "max_length";
  max: T;
  code?: string | undefined;
};

export type MaxLengthRuleErrorMessage = ErrorMessageFromRule<MaxLengthRule>;

export function maxLength<T extends number | Reference>(max: T, code?: string): MaxLengthRule<T> {
  return { max, type: "max_length", code };
}

export function maxLengthRule<T extends StringSchema | ArraySchema<never>>({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<T, Extract<ExtractResolvedRules<T>, MaxLengthRule>>):
  | OmitBaseErrorMessageProps<MaxLengthRuleErrorMessage>
  | undefined {
  const { value: max } = unpackRef(rule.max, path, context, SchemaType.NUMBER);

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
}
