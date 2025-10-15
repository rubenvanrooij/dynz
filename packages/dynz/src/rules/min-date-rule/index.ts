import { type Reference, UnpackedReferenceReturnValue, UnpackedReferenceValue, unpackRef } from "../../reference";
import type { DateSchema, DateStringSchema } from "../../schemas";
import {
  type DateString,
  type ErrorMessageFromRule,
  type ExtractResolvedRules,
  type RuleFn,
  SchemaType,
} from "../../types";
import { parseDateString } from "../../validate/validate-type";
import { isAfter } from "../after-rule";
import { getDateFromDateOrDateStringRefeference } from "../utils/reference";

export type MinDateRule<T extends Date | DateString | Reference = Date | DateString | Reference> = {
  type: "min_date";
  min: T;
  code?: string | undefined;
};

export type MinDateRuleErrorMessage = ErrorMessageFromRule<MinDateRule>;

export function minDate<T extends Date | DateString | Reference>(min: T, code?: string): MinDateRule<T> {
  return { min, type: "min_date", code };
}

export const minDateRule: RuleFn<
  DateSchema,
  Extract<ExtractResolvedRules<DateSchema>, MinDateRule>,
  MinDateRuleErrorMessage
> = ({ rule, value, path, context }) => {
  const unpackedRef = unpackRef(rule.min, path, context, SchemaType.DATE_STRING, SchemaType.DATE);
  const min = unpackedRef.static ? unpackedRef.value : getDateFromDateOrDateStringRefeference(unpackedRef);

  if (min === undefined) {
    return undefined;
  }

  return isAfter(value, min) || value.getTime() === min.getTime()
    ? undefined
    : {
        code: "min_date",
        min: unpackedRef.value!,
        message: `The value ${value} for schema ${path} is before or on ${unpackedRef.value}`,
      };
};

export const minDateStringRule: RuleFn<
  DateStringSchema,
  Extract<ExtractResolvedRules<DateStringSchema>, MinDateRule>,
  MinDateRuleErrorMessage
> = ({ rule, value, path, context, schema }) => {
  const unpackedRef = unpackRef(rule.min, path, context, SchemaType.DATE_STRING, SchemaType.DATE);
  const minDate = unpackedRef.static
    ? parseDateString(unpackedRef.value, schema.format)
    : getDateFromDateOrDateStringRefeference(unpackedRef);

  if (minDate === undefined) {
    return undefined;
  }

  const valueDate = parseDateString(value, schema.format);

  return isAfter(valueDate, minDate) || valueDate.getTime() === minDate.getTime()
    ? undefined
    : {
        code: "min_date",
        min: unpackedRef.value!,
        message: `The value ${value} for schema ${path} is before or on ${unpackedRef.value}`,
      };
};
