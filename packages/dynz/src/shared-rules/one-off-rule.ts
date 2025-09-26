import type { ValueOrReference } from "../reference";
import type { NumberSchema, StringSchema } from "../schemas";
import type {
  ErrorMessageFromRule,
  ExtractResolvedRules,
  OmitBaseErrorMessageProps,
  ValidateRuleContext,
} from "../types";

export type OneOfRule<T extends ValueOrReference[] = ValueOrReference[]> = {
  type: "one_of";
  values: T;
  code?: string | undefined;
};

export type OneOfRuleErrorMessage = ErrorMessageFromRule<OneOfRule>;

export function oneOf<T extends (string | number)[]>(values: T, code?: string): OneOfRule<T> {
  return { values, type: "one_of", code };
}

export function oneOfRule<T extends StringSchema | NumberSchema>({
  value,
  rule,
}: ValidateRuleContext<T, Extract<ExtractResolvedRules<T>, OneOfRule>>):
  | OmitBaseErrorMessageProps<OneOfRuleErrorMessage>
  | undefined {
  return rule.values.some((v) => v === value)
    ? undefined
    : {
        code: "one_of",
        values: rule.values,
        message: `The value ${value} is not a one of ${rule.values}`,
      };
}
