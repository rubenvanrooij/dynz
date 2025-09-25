import { unpackRefValue } from "../resolve";
import type { BooleanSchema, NumberSchema, OptionsSchema, StringSchema } from "../schemas";
import type { EqualsRule, ExtractResolvedRules, ValidateRuleContext } from "../types";
import { ErrorCode } from "../types";

export function equalsRule<T extends StringSchema | NumberSchema | BooleanSchema | OptionsSchema>({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<T, Extract<ExtractResolvedRules<T>, EqualsRule>>) {
  const refOrValue = unpackRefValue(rule.value, path, context);
  return refOrValue === value
    ? undefined
    : {
        code: ErrorCode.EQUALS,
        equals: refOrValue,
        message: `The value for schema ${path} does not equal $refOrValue`,
      };
}
