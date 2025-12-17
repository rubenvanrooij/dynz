import { type Func, resolve } from "../../conditions";
import { type Reference, unpackRef } from "../../reference";
import type { NumberSchema } from "../../schemas";
import { type ErrorMessageFromRule, type ExtractResolvedRules, type RuleFn, SchemaType } from "../../types";

export type MinRule<T extends number | Reference | Func = number | Reference | Func> = {
  type: "min";
  min: T;
  code?: string | undefined;
};

export type MinRuleErrorMessage = ErrorMessageFromRule<MinRule>;

export function min<T extends number | Reference | Func>(min: T, code?: string): MinRule<T> {
  return { min, type: "min", code };
}

export const minRule: RuleFn<
  NumberSchema,
  Extract<ExtractResolvedRules<NumberSchema>, MinRule>,
  MinRuleErrorMessage
> = ({ rule, value, path, context }) => {
  const min = resolve(rule.min, path, context, SchemaType.NUMBER);

  // const { value: min } = unpackRef(rule.min, path, context, SchemaType.NUMBER);

  if (min === undefined) {
    return undefined;
  }

  return value >= min
    ? undefined
    : {
        code: "min",
        min: min,
        message: `The value ${value} for schema ${path} should be at least ${min}`,
      };
};
