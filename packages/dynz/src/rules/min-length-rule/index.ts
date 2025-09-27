import { type Reference, unpackRef } from "../../reference";
import type { ArraySchema, StringSchema } from "../../schemas";
import {
  type ErrorMessageFromRule,
  type ExtractResolvedRules,
  type OmitBaseErrorMessageProps,
  SchemaType,
  type ValidateRuleContext,
} from "../../types";

export type MinLengthRule<T extends number | Reference = number | Reference> = {
  type: "min_length";
  min: T;
  code?: string | undefined;
};

export type MinLengthRuleErrorMessage = ErrorMessageFromRule<MinLengthRule>;

export function minLength<T extends number | Reference>(min: T, code?: string): MinLengthRule<T> {
  return { min, type: "min_length", code };
}

export function minLengthRule<T extends StringSchema | ArraySchema<never>>({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<T, Extract<ExtractResolvedRules<T>, MinLengthRule>>):
  | OmitBaseErrorMessageProps<MinLengthRuleErrorMessage>
  | undefined {
  const { value: min } = unpackRef(rule.min, path, context, SchemaType.NUMBER);

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
}
