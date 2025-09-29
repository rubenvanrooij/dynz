import { isAfter } from "date-fns";
import { type Reference, unpackRef } from "../../reference";
import type { DateSchema } from "../../schemas";
import type { ErrorMessageFromRule, RuleFn } from "../../types";

export type AfterRule<T extends Date | Reference = Date | Reference> = {
  type: "after";
  after: T;
  code?: string | undefined;
};

export type AfterRuleErrorMessage = ErrorMessageFromRule<AfterRule>;

export function after<T extends Date | Reference>(after: T, code?: string): AfterRule<T> {
  return { after, type: "after", code };
}

export const afterRule: RuleFn<DateSchema, AfterRule, AfterRuleErrorMessage> = ({
  rule,
  value,
  path,
  schema,
  context,
}) => {
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
