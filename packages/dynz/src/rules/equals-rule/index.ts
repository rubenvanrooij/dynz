import { type ParamaterValue, resolveExpected } from "../../functions";
import type { BooleanSchema, NumberSchema, OptionsSchema, StringSchema } from "../../schemas";
import type { EnumSchema } from "../../schemas/enum";
import type { ErrorMessageFromRule, ExtractResolvedRules, RuleFn } from "../../types";

export type EqualsRule<T extends ParamaterValue = ParamaterValue> = {
  type: "equals";
  equals: T;
  code?: string | undefined;
};

export type EqualsRuleErrorMessage = ErrorMessageFromRule<Omit<EqualsRule, "equals"> & { equals: unknown }>;

export function equals<T extends ParamaterValue>(equals: T, code?: string): EqualsRule<T> {
  return { equals, type: "equals", code };
}

type AllowedSchemas = StringSchema | NumberSchema | BooleanSchema | OptionsSchema | EnumSchema;

export const equalsRule: RuleFn<
  AllowedSchemas,
  Extract<ExtractResolvedRules<AllowedSchemas>, EqualsRule>,
  EqualsRuleErrorMessage
> = ({ rule, value, path, context, schema }) => {
  const equals = resolveExpected(rule.equals, path, context, schema.type);
  return equals === value
    ? undefined
    : {
        code: "equals",
        equals: equals,
        message: `The value for schema ${path} does not equal ${equals}`,
      };
};
// TODO: Verify if necessary
// export const equalsDateRule: RuleFn<
//   DateSchema,
//   Extract<ExtractResolvedRules<DateSchema>, EqualsRule>,
//   EqualsRuleErrorMessage
// > = ({ rule, value, path, context }) => {
//   const unpackedRef = resolve(rule.equals, path, context, SchemaType.DATE, SchemaType.DATE_STRING);

//   if (equals === undefined) {
//     return undefined;
//   }

//   return equals.getTime() === value.getTime()
//     ? undefined
//     : {
//       code: "equals",
//       equals: unpackedRef.value,
//       message: `The value for schema ${path} does not equal ${unpackedRef.value}`,
//     };
// };

// export const equalsDateStringRule: RuleFn<
//   DateStringSchema,
//   Extract<ExtractResolvedRules<DateStringSchema>, EqualsRule>,
//   EqualsRuleErrorMessage
// > = ({ rule, value, path, context, schema }) => {
//   const unpackedRef = unpackRef(rule.equals, path, context, SchemaType.DATE, SchemaType.DATE_STRING);
//   const equals = unpackedRef.static
//     ? parseDateString(unpackedRef.value, schema.format)
//     : getDateFromDateOrDateStringRefeference(unpackedRef);

//   if (equals === undefined) {
//     return undefined;
//   }

//   return equals.getTime() === parseDateString(value, schema.format).getTime()
//     ? undefined
//     : {
//       code: "equals",
//       equals: unpackedRef.value,
//       message: `The value for schema ${path} does not equal ${unpackedRef.value}`,
//     };
// };
