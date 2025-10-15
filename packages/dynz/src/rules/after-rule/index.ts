import { type Reference, unpackRef } from "../../reference";
import type { DateSchema, DateStringSchema } from "../../schemas";
import {
  SchemaType,
  type DateString,
  type ErrorMessageFromRule,
  type ExtractResolvedRules,
  type RuleFn,
} from "../../types";
import { parseDateString } from "../../validate/validate-type";
import { getDateFromDateOrDateStringRefeference } from "../utils/reference";

export type AfterRule<T extends Date | DateString | Reference = Date | DateString | Reference> = {
  type: "after";
  after: T;
  code?: string | undefined;
};

export type AfterRuleErrorMessage = ErrorMessageFromRule<AfterRule>;

export function after<T extends Date | DateString | Reference>(after: T, code?: string): AfterRule<T> {
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
  const unpackedRef = unpackRef(rule.after, path, context, SchemaType.DATE, SchemaType.DATE_STRING);
  const after = unpackedRef.static ? unpackedRef.value : getDateFromDateOrDateStringRefeference(unpackedRef);

  if (after === undefined) {
    return undefined;
  }

  return isAfter(value, after)
    ? undefined
    : {
        code: "after",
        after: unpackedRef.value!,
        message: `The value ${value} for schema ${path} is before ${unpackedRef.value}`,
      };
};

export const afterDateStringRule: RuleFn<
  DateStringSchema,
  Extract<ExtractResolvedRules<DateStringSchema>, AfterRule>,
  AfterRuleErrorMessage
> = ({ rule, value, path, schema, context }) => {
  const unpackedRef = unpackRef(rule.after, path, context, SchemaType.DATE, SchemaType.DATE_STRING);
  const after = unpackedRef.static
    ? parseDateString(unpackedRef.value, schema.format)
    : getDateFromDateOrDateStringRefeference(unpackedRef);

  if (after === undefined) {
    return undefined;
  }

  return isAfter(parseDateString(value, schema.format), after)
    ? undefined
    : {
        code: "after",
        after: unpackedRef.value!,
        message: `The value ${value} for schema ${path} is before ${unpackedRef.value}`,
      };
};
