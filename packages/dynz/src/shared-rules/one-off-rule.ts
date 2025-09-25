import type { NumberSchema, StringSchema } from "../schemas";
import { ErrorCode, type ExtractResolvedRules, type OneOfRule, type ValidateRuleContext } from "../types";

export function oneOfRule<T extends StringSchema | NumberSchema>({
  value,
  rule,
}: ValidateRuleContext<T, Extract<ExtractResolvedRules<T>, OneOfRule>>) {
  return rule.values.some((v) => v === value)
    ? undefined
    : {
        code: ErrorCode.ONE_OF,
        expected: rule.values,
        message: `The value ${value} is not a one of ${rule.values}`,
      };
}
