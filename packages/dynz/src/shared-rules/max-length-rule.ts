import type { Reference } from "../conditions";
import { unpackRefValue } from "../resolve";
import type { ArraySchema, StringSchema } from "../schemas";
import type {
  ErrorMessageFromRule,
  ExtractResolvedRules,
  OmitBaseErrorMessageProps,
  ValidateRuleContext,
} from "../types";
import { assertNumber } from "../validate";

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
  const max = unpackRefValue(rule.max, path, context);

  if (max === undefined) {
    return undefined;
  }

  const compareTo = assertNumber(max);
  return value.length <= compareTo
    ? undefined
    : {
        code: "max_length",
        max: compareTo,
        message: `The value ${value} for schema ${path} should have a maximum length of ${compareTo}`,
      };
}
