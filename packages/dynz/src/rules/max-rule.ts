import { type Reference, unpackRefValue } from "../reference";
import type { NumberSchema } from "../schemas";
import type {
  ErrorMessageFromRule,
  ExtractResolvedRules,
  OmitBaseErrorMessageProps,
  ValidateRuleContext,
} from "../types";
import { assertNumber } from "../validate";

export type MaxRule<T extends number | Reference = number | Reference> = {
  type: "max";
  max: T;
  code?: string | undefined;
};

export type MaxRuleErrorMessage = ErrorMessageFromRule<MaxRule>;

export function max<T extends number | Reference>(max: T, code?: string): MaxRule<T> {
  return { max, type: "max", code };
}

export function maxRule<T extends NumberSchema>({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<T, Extract<ExtractResolvedRules<T>, MaxRule>>):
  | OmitBaseErrorMessageProps<MaxRuleErrorMessage>
  | undefined {
  const max = unpackRefValue(rule.max, path, context);

  if (max === undefined) {
    return undefined;
  }

  const compareTo = assertNumber(max);
  return value <= compareTo
    ? undefined
    : {
        code: "max",
        max: compareTo,
        message: `The value ${value} for schema ${path} should have a maximum of ${compareTo}`,
      };
}
