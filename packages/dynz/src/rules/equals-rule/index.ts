import { unpackRef, type ValueOrReference } from "../../reference";
import type { BooleanSchema, DateSchema, NumberSchema, OptionsSchema, StringSchema } from "../../schemas";
import {
  type ErrorMessageFromRule,
  type ExtractResolvedRules,
  type OmitBaseErrorMessageProps,
  SchemaType,
  type ValidateRuleContext,
} from "../../types";

export type EqualsRule<T extends ValueOrReference = ValueOrReference> = {
  type: "equals";
  equals: T;
  code?: string | undefined;
};

export type EqualsRuleErrorMessage = ErrorMessageFromRule<Omit<EqualsRule, "equals"> & { equals: unknown }>;

export function equals<T extends ValueOrReference>(equals: T, code?: string): EqualsRule<T> {
  return { equals, type: "equals", code };
}

export function equalsRule<T extends StringSchema | NumberSchema | BooleanSchema | OptionsSchema>({
  rule,
  value,
  path,
  context,
  schema,
}: ValidateRuleContext<T, Extract<ExtractResolvedRules<T>, EqualsRule>>):
  | OmitBaseErrorMessageProps<EqualsRuleErrorMessage>
  | undefined {
  const { value: equals } = unpackRef(rule.equals, path, context, schema.type);
  return equals === value
    ? undefined
    : {
        code: "equals",
        equals: equals,
        message: `The value for schema ${path} does not equal ${equals}`,
      };
}

export function equalsDateRule<T extends DateSchema>({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<T, Extract<ExtractResolvedRules<T>, EqualsRule>>):
  | OmitBaseErrorMessageProps<EqualsRuleErrorMessage>
  | undefined {
  const { value: equals } = unpackRef(rule.equals, path, context, SchemaType.DATE);

  if (equals === undefined) {
    return undefined;
  }

  return equals.getTime() === value.getTime()
    ? undefined
    : {
        code: "equals",
        equals,
        message: `The value for schema ${path} does not equal ${equals}`,
      };
}
