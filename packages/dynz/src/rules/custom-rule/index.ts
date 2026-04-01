import { type ParamaterValue, resolve } from "../../functions";
import type { ErrorMessageFromRule, ExtractResolvedRules, RuleFn, Schema } from "../../types";

export type CustomRule<T extends Record<string, ParamaterValue> = Record<string, ParamaterValue>> = {
  type: "custom";
  name: string;
  params: T;
  code?: string | undefined;
};

export type CustomRuleErrorMessage = ErrorMessageFromRule<
  Omit<CustomRule, "params"> & { params: Record<string, unknown>; result: Record<string, unknown> }
>;

export function custom(name: string): CustomRule;
export function custom<T extends Record<string, ParamaterValue>>(name: string, params: T): CustomRule<T>;
export function custom<T extends Record<string, ParamaterValue>>(name: string, params?: T): CustomRule {
  return { type: "custom", name, params: params || {} };
}

export const customRule: RuleFn<
  Schema,
  Extract<ExtractResolvedRules<Schema>, CustomRule>,
  CustomRuleErrorMessage
> = async ({ rule, value, path, context, schema }) => {
  const validatorFn = context.validateOptions.customRules?.[rule.name];

  if (validatorFn === undefined) {
    throw new Error(`Custom rule "${rule.name}" is not defined in the custom rules map.`);
  }

  // unpack all references in the rule
  const unpackedParams = Object.entries(rule.params).reduce<Record<string, unknown>>((acc, [key, valueOrRef]) => {
    acc[key] = resolve(valueOrRef, path, context);
    return acc;
  }, {});

  const result = await validatorFn(
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
        code: "custom",
        params: unpackedParams,
        result: typeof result !== "boolean" ? { ...result, success: undefined } : {},
        name: rule.name,
      };
};
