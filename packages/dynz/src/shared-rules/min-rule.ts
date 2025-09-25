import type { Reference } from "../conditions";
import { unpackRefValue } from "../resolve";
import type { NumberSchema } from "../schemas";
import type {
  ErrorMessageFromRule,
  ExtractResolvedRules,
  OmitBaseErrorMessageProps,
  ValidateRuleContext,
} from "../types";
import { assertNumber } from "../validate";

export type MinRule<T extends number | Reference = number | Reference> = {
  type: "min";
  min: T;
  code?: string | undefined;
};

export type MinRuleErrorMessage = ErrorMessageFromRule<MinRule>;

export function min<T extends number | Reference>(min: T, code?: string): MinRule<T> {
  return { min, type: "min", code };
}

export function minRule<T extends NumberSchema>({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<T, Extract<ExtractResolvedRules<T>, MinRule>>):
  | OmitBaseErrorMessageProps<MinRuleErrorMessage>
  | undefined {
  const min = unpackRefValue(rule.min, path, context);

  if (min === undefined) {
    return undefined;
  }

  const compareTo = assertNumber(min);
  return value >= compareTo
    ? undefined
    : {
        code: "min",
        min: compareTo,
        message: `The value ${value} for schema ${path} should be at least ${compareTo}`,
      };
}
