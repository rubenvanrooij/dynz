import { type Reference, unpackRef } from "../../reference";
import type { DateSchema, DateStringSchema } from "../../schemas";
import {
  type DateString,
  type ErrorMessageFromRule,
  type ExtractResolvedRules,
  type RuleFn,
  SchemaType,
} from "../../types";
import { parseDateString } from "../../validate/validate-type";
import { getDateFromDateOrDateStringRefeference } from "../utils/reference";

export type BeforeRule<T extends Date | DateString | Reference = Date | DateString | Reference> = {
  type: "before";
  before: T;
  code?: string | undefined;
};

export type BeforeRuleErrorMessage = ErrorMessageFromRule<BeforeRule>;

export function before<T extends Date | DateString | Reference>(before: T, code?: string): BeforeRule<T> {
  return { before, type: "before", code };
}

export function isBefore(value: Date, before: Date): boolean {
  return value.getTime() < before.getTime();
}

export const beforeRule: RuleFn<
  DateSchema,
  Extract<ExtractResolvedRules<DateSchema>, BeforeRule>,
  BeforeRuleErrorMessage
> = ({ rule, value, path, context }) => {
  const unpackedRef = unpackRef(rule.before, path, context, SchemaType.DATE, SchemaType.DATE_STRING);
  const before = unpackedRef.static ? unpackedRef.value : getDateFromDateOrDateStringRefeference(unpackedRef);

  if (before === undefined) {
    return undefined;
  }

  return isBefore(value, before)
    ? undefined
    : {
        code: "before",
        before,
        message: `The value ${value} for schema ${path} is after ${unpackedRef.value}`,
      };
};

export const beforeDateStringRule: RuleFn<
  DateStringSchema,
  Extract<ExtractResolvedRules<DateStringSchema>, BeforeRule>,
  BeforeRuleErrorMessage
> = ({ rule, value, path, context, schema }) => {
  const unpackedRef = unpackRef(rule.before, path, context, SchemaType.DATE, SchemaType.DATE_STRING);
  const before = unpackedRef.static
    ? parseDateString(unpackedRef.value, schema.format)
    : getDateFromDateOrDateStringRefeference(unpackedRef);

  if (before === undefined) {
    return undefined;
  }

  return isBefore(parseDateString(value, schema.format), before)
    ? undefined
    : {
        code: "before",
        before,
        message: `The value ${value} for schema ${path} is after ${unpackedRef.value}`,
      };
};
