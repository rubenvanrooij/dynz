import { type Reference, unpackRef } from "../../reference";
import type { NumberSchema } from "../../schemas";
import {
  type ErrorMessageFromRule,
  type ExtractResolvedRules,
  type OmitBaseErrorMessageProps,
  SchemaType,
  type ValidateRuleContext,
} from "../../types";

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
  const { value: min } = unpackRef(rule.min, path, context, SchemaType.NUMBER);

  if (min === undefined) {
    return undefined;
  }

  return value >= min
    ? undefined
    : {
        code: "min",
        min: min,
        message: `The value ${value} for schema ${path} should be at least ${min}`,
      };
}
