import { unpackRefValue, type ValueOrReference } from "../reference";
import type { BooleanSchema, DateSchema, NumberSchema, OptionsSchema, StringSchema } from "../schemas";
import type {
  ErrorMessageFromRule,
  ExtractResolvedRules,
  OmitBaseErrorMessageProps,
  ValidateRuleContext,
} from "../types";
import { coerce } from "../utils";
import { assertDate } from "../validate";

export type EqualsRule<T extends ValueOrReference = ValueOrReference> = {
  type: "equals";
  equals: T;
  code?: string | undefined;
};

export type EqualsRuleErrorMessage = ErrorMessageFromRule<Omit<EqualsRule, "equals"> & { equals: unknown }>;

export function equals<T extends ValueOrReference>(equals: T, code?: string): EqualsRule<T> {
  return { equals, type: "equals", code };
}

export function equalsRule<T extends StringSchema | NumberSchema | BooleanSchema | OptionsSchema>({
  rule,
  value,
  path,
  context,
}: ValidateRuleContext<T, Extract<ExtractResolvedRules<T>, EqualsRule>>):
  | OmitBaseErrorMessageProps<EqualsRuleErrorMessage>
  | undefined {
  const refOrValue = unpackRefValue(rule.equals, path, context);
  return refOrValue === value
    ? undefined
    : {
        code: "equals",
        equals: refOrValue,
        message: `The value for schema ${path} does not equal ${refOrValue}`,
      };
}

export function equalsDateRule<T extends DateSchema>({
  rule,
  value,
  path,
  schema,
  context,
}: ValidateRuleContext<T, Extract<ExtractResolvedRules<T>, EqualsRule>>):
  | OmitBaseErrorMessageProps<EqualsRuleErrorMessage>
  | undefined {
  const compareTo = assertDate(coerce(schema, unpackRefValue(rule.equals, path, context)));
  return compareTo.getTime() === value.getTime()
    ? undefined
    : {
        code: "equals",
        equals: compareTo,
        message: `The value for schema ${path} does not equal ${compareTo}`,
      };
}
