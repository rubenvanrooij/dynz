import { type ParamaterValue, resolveExpected } from "../../functions";
import type { DateSchema } from "../../schemas";
import {
  type ErrorMessageFromRule,
  type ExtractResolvedRules,
  type RuleFn,
  type Schema,
  SchemaType,
} from "../../types";
import { isDate } from "../../validate/validate-type";

export type BeforeRule<T extends ParamaterValue<Date> = ParamaterValue<Date>> = {
  type: "before";
  before: T;
  code?: string | undefined;
};

export type BeforeRuleErrorMessage = ErrorMessageFromRule<BeforeRule, Date, "before">;

export function before<T extends ParamaterValue<Date>>(before: T, code?: string): BeforeRule<T> {
  return { before, type: "before", code };
}

export function isBefore(value: Date, before: Date): boolean {
  return value.getTime() < before.getTime();
}

export const beforeRule: RuleFn<Schema, Extract<ExtractResolvedRules<Schema>, BeforeRule>, BeforeRuleErrorMessage> = ({
  rule,
  value,
  path,
  context,
}) => {
  if (!isDate(value)) {
    throw new Error("afterRule expects a date value");
  }

  const before = resolveExpected(rule.before, path, context, SchemaType.DATE);

  if (before === undefined) {
    return undefined;
  }

  return isBefore(value, before)
    ? undefined
    : {
        code: "before",
        before,
        message: `The value ${value} for schema ${path} is after ${before}`,
      };
};

// export const beforeDateStringRule: RuleFn<
//   DateStringSchema,
//   Extract<ExtractResolvedRules<DateStringSchema>, BeforeRule>,
//   BeforeRuleErrorMessage
// > = ({ rule, value, path, context, schema }) => {
//   const unpackedRef = unpackRef(rule.before, path, context, SchemaType.DATE, SchemaType.DATE_STRING);
//   const before = unpackedRef.static
//     ? parseDateString(unpackedRef.value, schema.format)
//     : getDateFromDateOrDateStringRefeference(unpackedRef);

//   if (before === undefined) {
//     return undefined;
//   }

//   return isBefore(parseDateString(value, schema.format), before)
//     ? undefined
//     : {
//       code: "before",
//       before,
//       message: `The value ${value} for schema ${path} is after ${unpackedRef.value}`,
//     };
// };
