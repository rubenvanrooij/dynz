import { type Reference, unpackRef } from "../../reference";
import type { FileSchema } from "../../schemas";
import {
  type ErrorMessageFromRule,
  type ExtractResolvedRules,
  type OmitBaseErrorMessageProps,
  SchemaType,
  type ValidateRuleContext,
} from "../../types";

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
}
