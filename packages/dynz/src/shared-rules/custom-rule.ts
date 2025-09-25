import { unpackRefValue } from "../resolve";
import { type CustomRule, ErrorCode, type ExtractResolvedRules, type Schema, type ValidateRuleContext } from "../types";

export function customRule<T extends Schema>({
  rule,
  value,
  path,
  context,
  schema,
}: ValidateRuleContext<T, Extract<ExtractResolvedRules<T>, CustomRule>>) {
  const validatorFn = context.validateOptions.customRules?.[rule.name];

  if (validatorFn === undefined) {
    throw new Error(`Custom rule "${rule.name}" is not defined in the custom rules map.`);
  }

  // unpack all references in the rule
  const unpackedParams = Object.entries(rule.params).reduce<Record<string, unknown>>((acc, [key, valueOrRef]) => {
    acc[key] = unpackRefValue(valueOrRef, path, context);
    return acc;
  }, {});

  const result = validatorFn(
    {
      schema: schema,
      value: value,
    },
    unpackedParams,
    path,
    schema
  );

  return result === true
    ? undefined
    : {
        message: `The value for schema ${path} did not pass the custom validation rule "${rule.name}"`, // Message can be overridden by custom function
        ...(typeof result !== "boolean" ? { ...result, success: undefined } : {}),
        code: ErrorCode.CUSTOM,
        name: rule.name,
      };
}
