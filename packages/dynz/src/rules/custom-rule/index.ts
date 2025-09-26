import { unpackRefValue, type ValueOrReference } from "../../reference";
import type {
  ErrorMessageFromRule,
  ExtractResolvedRules,
  OmitBaseErrorMessageProps,
  Schema,
  ValidateRuleContext,
} from "../../types";

export type CustomRule<T extends Record<string, ValueOrReference> = Record<string, ValueOrReference>> = {
  type: "custom";
  name: string;
  params: T;
  code?: string | undefined;
};

export type CustomRuleErrorMessage = ErrorMessageFromRule<
  Omit<CustomRule, "params"> & { params: Record<string, unknown> }
>;

export function custom(name: string): CustomRule;
export function custom<T extends Record<string, ValueOrReference>>(name: string, params: T): CustomRule<T>;
export function custom<T extends Record<string, ValueOrReference>>(name: string, params?: T): CustomRule {
  return { type: "custom", name, params: params || {} };
}

export function customRule<T extends Schema>({
  rule,
  value,
  path,
  context,
  schema,
}: ValidateRuleContext<T, Extract<ExtractResolvedRules<T>, CustomRule>>):
  | OmitBaseErrorMessageProps<CustomRuleErrorMessage>
  | undefined {
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
        code: "custom",
        params: unpackedParams,
        name: rule.name,
      };
}
