import { type Reference, unpackRef } from "../../reference";
import type { DateSchema, DateStringSchema } from "../../schemas";
import type { DateString, ErrorMessageFromRule, ExtractResolvedRules, RuleFn } from "../../types";
import { parseDateString } from "../../validate/validate-type";

export type AfterRule<T extends Date | DateString | Reference = Date | DateString | Reference> = {
  type: "after";
  after: T;
  code?: string | undefined;
};

export type AfterRuleErrorMessage = ErrorMessageFromRule<AfterRule>;

export function after<T extends Date | Reference>(after: T, code?: string): AfterRule<T> {
  return { after, type: "after", code };
}

export function isAfter(value: Date, after: Date): boolean {
  return value.getTime() > after.getTime();
}

export const afterRule: RuleFn<
  DateSchema,
  Extract<ExtractResolvedRules<DateSchema>, AfterRule>,
  AfterRuleErrorMessage
> = ({ rule, value, path, schema, context }) => {
  const { value: after } = unpackRef(rule.after, path, context, schema.type);

  if (after === undefined) {
    return undefined;
  }

  return isAfter(value, after)
    ? undefined
    : {
        code: "after",
        after: after,
        message: `The value ${value} for schema ${path} is before ${after}`,
      };
};

export const afterDateStringRule: RuleFn<
  DateStringSchema,
  Extract<ExtractResolvedRules<DateStringSchema>, AfterRule>,
  AfterRuleErrorMessage
> = ({ rule, value, path, schema, context }) => {
  const { value: after } = unpackRef(rule.after, path, context, schema.type);

  if (after === undefined) {
    return undefined;
  }

  return isAfter(parseDateString(value, schema.format), parseDateString(after, schema.format))
    ? undefined
    : {
        code: "after",
        after: after,
        message: `The value ${value} for schema ${path} is before ${after}`,
      };
};
