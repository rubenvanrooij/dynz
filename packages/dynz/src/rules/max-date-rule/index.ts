import { isBefore, isDate } from "date-fns";
import { type ParamaterValue, resolveExpected } from "../../functions";
import {
  type ErrorMessageFromRule,
  type ExtractResolvedRules,
  type RuleFn,
  type Schema,
  SchemaType,
} from "../../types";

export type MaxDateRule<T extends ParamaterValue<Date> = ParamaterValue<Date>> = {
  type: "max_date";
  max: T;
  code?: string | undefined;
};

export type MaxDateRuleErrorMessage = ErrorMessageFromRule<MaxDateRule, Date, "max">;

export function buildMaxDateRule<T extends ParamaterValue<Date>>(max: T, code?: string): MaxDateRule<T> {
  return { max, type: "max_date", code };
}

export const maxDateRule: RuleFn<
  Schema,
  Extract<ExtractResolvedRules<Schema>, MaxDateRule>,
  MaxDateRuleErrorMessage
> = ({ rule, value, path, context }) => {
  if (!isDate(value)) {
    throw new Error("maxDateRule expects a date value");
  }

  const max = resolveExpected(rule.max, path, context, SchemaType.DATE);

  if (max === undefined) {
    return undefined;
  }

  return isBefore(value, max) || value.getTime() === max.getTime()
    ? undefined
    : {
        code: "max_date",
        max,
        message: `The value ${value} for schema ${path} is after or on ${max}`,
      };
};

// export const maxDateStringRule: RuleFn<
//   DateStringSchema,
//   Extract<ExtractResolvedRules<DateStringSchema>, MaxDateRule>,
//   MaxDateRuleErrorMessage
// > = ({ rule, value, path, context, schema }) => {
//   const unpackedRef = unpackRef(rule.max, path, context, SchemaType.DATE, SchemaType.DATE_STRING);
//   const max = unpackedRef.static
//     ? parseDateString(unpackedRef.value, schema.format)
//     : getDateFromDateOrDateStringRefeference(unpackedRef);

//   if (max === undefined) {
//     return undefined;
//   }

//   const valueDate = parseDateString(value, schema.format);

//   return isBefore(valueDate, max) || valueDate.getTime() === max.getTime()
//     ? undefined
//     : {
//       code: "max_date",
//       max,
//       message: `The value ${value} for schema ${path} is after or on ${max}`,
//     };
// };
