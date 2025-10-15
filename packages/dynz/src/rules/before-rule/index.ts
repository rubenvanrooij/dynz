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

export type BeforeRule<T extends Date | DateString | Reference = Date | DateString | Reference> = {
  type: "before";
  before: T;
  code?: string | undefined;
};

export type BeforeRuleErrorMessage = ErrorMessageFromRule<BeforeRule>;

export function before<T extends Date | Reference>(before: T, code?: string): BeforeRule<T> {
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
  const { value: before } = unpackRef(rule.before, path, context, SchemaType.DATE);

  if (before === undefined) {
    return undefined;
  }

  return isBefore(value, before)
    ? undefined
    : {
        code: "before",
        before: before,
        message: `The value ${value} for schema ${path} is after ${before}`,
      };
};

export const beforeDateStringRule: RuleFn<
  DateStringSchema,
  Extract<ExtractResolvedRules<DateStringSchema>, BeforeRule>,
  BeforeRuleErrorMessage
> = ({ rule, value, path, context, schema }) => {
  const { value: before } = unpackRef(rule.before, path, context, SchemaType.DATE_STRING);

  if (before === undefined) {
    return undefined;
  }

  return isBefore(parseDateString(value, schema.format), parseDateString(before, schema.format))
    ? undefined
    : {
        code: "before",
        before: before,
        message: `The value ${value} for schema ${path} is after ${before}`,
      };
};
