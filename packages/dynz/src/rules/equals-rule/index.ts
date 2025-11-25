import { unpackRef, type ValueOrReference } from "../../reference";
import type {
  BooleanSchema,
  DateSchema,
  DateStringSchema,
  NumberSchema,
  OptionsSchema,
  StringSchema,
} from "../../schemas";
import type { EnumSchema } from "../../schemas/enum";
import { type ErrorMessageFromRule, type ExtractResolvedRules, type RuleFn, SchemaType } from "../../types";
import { parseDateString } from "../../validate/validate-type";
import { getDateFromDateOrDateStringRefeference } from "../utils/reference";

export type EqualsRule<T extends ValueOrReference = ValueOrReference> = {
  type: "equals";
  equals: T;
  code?: string | undefined;
};

export type EqualsRuleErrorMessage = ErrorMessageFromRule<Omit<EqualsRule, "equals"> & { equals: unknown }>;

export function equals<T extends ValueOrReference>(equals: T, code?: string): EqualsRule<T> {
  return { equals, type: "equals", code };
}

type AllowedSchemas = StringSchema | NumberSchema | BooleanSchema | OptionsSchema | EnumSchema;

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
  const unpackedRef = unpackRef(rule.equals, path, context, SchemaType.DATE, SchemaType.DATE_STRING);
  const equals = unpackedRef.static ? unpackedRef.value : getDateFromDateOrDateStringRefeference(unpackedRef);

  if (equals === undefined) {
    return undefined;
  }

  return equals.getTime() === value.getTime()
    ? undefined
    : {
        code: "equals",
        equals: unpackedRef.value,
        message: `The value for schema ${path} does not equal ${unpackedRef.value}`,
      };
};

export const equalsDateStringRule: RuleFn<
  DateStringSchema,
  Extract<ExtractResolvedRules<DateStringSchema>, EqualsRule>,
  EqualsRuleErrorMessage
> = ({ rule, value, path, context, schema }) => {
  const unpackedRef = unpackRef(rule.equals, path, context, SchemaType.DATE, SchemaType.DATE_STRING);
  const equals = unpackedRef.static
    ? parseDateString(unpackedRef.value, schema.format)
    : getDateFromDateOrDateStringRefeference(unpackedRef);

  if (equals === undefined) {
    return undefined;
  }

  return equals.getTime() === parseDateString(value, schema.format).getTime()
    ? undefined
    : {
        code: "equals",
        equals: unpackedRef.value,
        message: `The value for schema ${path} does not equal ${unpackedRef.value}`,
      };
};
