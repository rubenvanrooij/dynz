import { isAfter } from "date-fns";
import { type Reference, unpackRefValue } from "../reference";
import type { DateSchema } from "../schemas";
import type { ErrorMessageFromRule, OmitBaseErrorMessageProps, ValidateRuleContext } from "../types";
import { coerce } from "../utils";
import { assertDate } from "../validate/validate";

export type AfterRule<T extends Date | Reference = Date | Reference> = {
  type: "after";
  after: T;
  code?: string | undefined;
};

export type AfterRuleErrorMessage = ErrorMessageFromRule<AfterRule>;

export function after<T extends Date | Reference>(after: T, code?: string): AfterRule<T> {
  return { after, type: "after", code };
}

export function afterRule({
  rule,
  value,
  path,
  schema,
  context,
}: ValidateRuleContext<DateSchema, AfterRule<Date | Reference>>):
  | OmitBaseErrorMessageProps<AfterRuleErrorMessage>
  | undefined {
  const after = unpackRefValue(rule.after, path, context);
  const compareTo = assertDate(coerce(schema, after));
  return isAfter(value, compareTo)
    ? undefined
    : {
        code: "after",
        after: compareTo,
        message: `The value ${value} for schema ${path} is before ${after}`,
      };
}
