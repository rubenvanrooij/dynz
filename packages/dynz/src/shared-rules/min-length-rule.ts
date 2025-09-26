import { type Reference, unpackRefValue } from "../reference";
import type { ArraySchema, StringSchema } from "../schemas";
import type {
  ErrorMessageFromRule,
  ExtractResolvedRules,
  OmitBaseErrorMessageProps,
  ValidateRuleContext,
} from "../types";
import { assertNumber } from "../validate";

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
  const min = unpackRefValue(rule.min, path, context);

  if (min === undefined) {
    return undefined;
  }

  const compareTo = assertNumber(min);
  return value.length >= compareTo
    ? undefined
    : {
        code: "min_length",
        min: compareTo,
        message: `The value ${value} for schema ${path} should have at least a length of ${compareTo}`,
      };
}
