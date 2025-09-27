import { unpackRef, type ValueOrReference } from "../../reference";
import type { BooleanSchema, DateSchema, NumberSchema, OptionsSchema, StringSchema } from "../../schemas";
import { type ErrorMessageFromRule, type ExtractResolvedRules, type RuleFn, SchemaType } from "../../types";

export type EqualsRule<T extends ValueOrReference = ValueOrReference> = {
  type: "equals";
  equals: T;
  code?: string | undefined;
};

export type EqualsRuleErrorMessage = ErrorMessageFromRule<Omit<EqualsRule, "equals"> & { equals: unknown }>;

export function equals<T extends ValueOrReference>(equals: T, code?: string): EqualsRule<T> {
  return { equals, type: "equals", code };
}

type AllowedSchemas = StringSchema | NumberSchema | BooleanSchema | OptionsSchema;

export const equalsRule: RuleFn<
  AllowedSchemas,
  Extract<ExtractResolvedRules<AllowedSchemas>, EqualsRule>,
  EqualsRuleErrorMessage
> = ({ rule, value, path, context, schema }) => {
  const { value: equals } = unpackRef(rule.equals, path, context, schema.type);
  return equals === value
    ? undefined
    : {
        code: "equals",
        equals: equals,
        message: `The value for schema ${path} does not equal ${equals}`,
      };
};

export const equalsDateRule: RuleFn<
  DateSchema,
  Extract<ExtractResolvedRules<DateSchema>, EqualsRule>,
  EqualsRuleErrorMessage
> = ({ rule, value, path, context }) => {
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
};
