import { unpackRefValue } from "../resolve";
import type { FileSchema } from "../schemas";
import type {
  ErrorMessageFromRule,
  ExtractResolvedRules,
  OmitBaseErrorMessageProps,
  ValidateRuleContext,
} from "../types";
import type { Reference } from "../conditions";
import { assertNumber } from "../validate";

export type MinSizeRule<T extends number | Reference = number | Reference> = {
  type: "min_size";
  min: T;
  code?: string | undefined;
};

export type MinSizeRuleErrorMessage = ErrorMessageFromRule<MinSizeRule>;

export function minSize<T extends number | Reference>(min: T, code?: string): MinSizeRule<T> {
  return { min, type: "min_size", code };
}

export function minSizeRule<T extends FileSchema>({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<T, Extract<ExtractResolvedRules<T>, MinSizeRule>>):
  | OmitBaseErrorMessageProps<MinSizeRuleErrorMessage>
  | undefined {
  const min = unpackRefValue(rule.min, path, context);

  if (min === undefined) {
    return undefined;
  }

  const compareTo = assertNumber(min);
  return value.size >= compareTo
    ? undefined
    : {
        code: "min_size",
        min: compareTo,
        message: `The value ${value} for schema ${path} should have at least a size of ${compareTo}`,
      };
}
