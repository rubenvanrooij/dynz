import { type ParamaterValue, resolveExpected } from "../../functions";
import type { DateSchema } from "../../schemas";
import { type ErrorMessageFromRule, type ExtractResolvedRules, type RuleFn, SchemaType } from "../../types";

export type AfterRule<T extends ParamaterValue<Date> = ParamaterValue<Date>> = {
  type: "after";
  after: T;
  code?: string | undefined;
};

export type AfterRuleErrorMessage = ErrorMessageFromRule<AfterRule, Date, "after">;

export function after<T extends ParamaterValue<Date>>(after: T, code?: string): AfterRule<T> {
  return { after, type: "after", code };
}

export function isAfter(value: Date, after: Date): boolean {
  return value.getTime() > after.getTime();
}

export const afterRule: RuleFn<
  DateSchema,
  Extract<ExtractResolvedRules<DateSchema>, AfterRule>,
  AfterRuleErrorMessage
> = ({ rule, value, path, context }) => {
  const after = resolveExpected(rule.after, path, context, SchemaType.DATE);

  if (after === undefined) {
    return undefined;
  }

  return isAfter(value, after)
    ? undefined
    : {
        code: "after",
        after,
        message: `The value ${value} for schema ${path} is before ${after}`,
      };
};

// export const afterDateStringRule: RuleFn<
//   DateStringSchema,
//   Extract<ExtractResolvedRules<DateStringSchema>, AfterRule>,
//   AfterRuleErrorMessage
// > = ({ rule, value, path, schema, context }) => {
//   const unpackedRef = unpackRef(rule.after, path, context, SchemaType.DATE, SchemaType.DATE_STRING);
//   const after = unpackedRef.static
//     ? parseDateString(unpackedRef.value, schema.format)
//     : getDateFromDateOrDateStringRefeference(unpackedRef);

//   if (after === undefined) {
//     return undefined;
//   }

//   return isAfter(parseDateString(value, schema.format), after)
//     ? undefined
//     : {
//       code: "after",
//       after,
//       message: `The value ${value} for schema ${path} is before ${unpackedRef.value}`,
//     };
// };
