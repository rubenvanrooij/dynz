import { coerce, unpackRefValue } from "../../../resolve";
import { type EqualsRule, ErrorCode, type Reference, type ValidateRuleContext } from "../../../types";
import { assertDate } from "../../../validate";
import type { DateSchema } from "../types";

export function equalsRule({
  rule,
  value,
  path,
  context,
  schema,
}: ValidateRuleContext<DateSchema, EqualsRule<Date | Reference>>) {
  const compareTo = assertDate(coerce(schema.type, unpackRefValue(rule.value, path, context)));
  return compareTo.getTime() === value.getTime()
    ? undefined
    : {
        code: ErrorCode.EQUALS,
        equals: compareTo,
        message: `The value for schema ${path} does not equal ${compareTo}`,
      };
}
