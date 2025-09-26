import { type Reference, unpackRefValue } from "../../reference";
import type { FileSchema } from "../../schemas";
import type {
  ErrorMessageFromRule,
  ExtractResolvedRules,
  OmitBaseErrorMessageProps,
  ValidateRuleContext,
} from "../../types";
import { assertNumber } from "../../validate";

export type MaxSizeRule<T extends number | Reference = number | Reference> = {
  type: "max_size";
  max: T;
  code?: string | undefined;
};

export type MaxSizeRuleErrorMessage = ErrorMessageFromRule<MaxSizeRule>;

export function maxSize<T extends number | Reference>(max: T, code?: string): MaxSizeRule<T> {
  return { max, type: "max_size", code };
}

export function maxSizeRule<T extends FileSchema>({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<T, Extract<ExtractResolvedRules<T>, MaxSizeRule>>):
  | OmitBaseErrorMessageProps<MaxSizeRuleErrorMessage>
  | undefined {
  const min = unpackRefValue(rule.max, path, context);

  if (min === undefined) {
    return undefined;
  }

  const compareTo = assertNumber(min);
  return value.size <= compareTo
    ? undefined
    : {
        code: "max_size",
        max: compareTo,
        message: `The value ${value} for schema ${path} should have a maximum size of ${compareTo}`,
      };
}
