import { unpackRef, type ValueOrReference } from "../../reference";
import type { NumberSchema, StringSchema } from "../../schemas";
import type { ErrorMessageFromRule, ExtractResolvedRules, RuleFn } from "../../types";

export type OneOfRule<T extends ValueOrReference[] = ValueOrReference[]> = {
  type: "one_of";
  values: T;
  code?: string | undefined;
};

export type OneOfRuleErrorMessage = ErrorMessageFromRule<OneOfRule>;

export function oneOf<T extends ValueOrReference[]>(values: T, code?: string): OneOfRule<T> {
  return { values, type: "one_of", code };
}

type AllowedSchemas = StringSchema | NumberSchema;

export const oneOfRule: RuleFn<
  AllowedSchemas,
  Extract<ExtractResolvedRules<AllowedSchemas>, OneOfRule>,
  OneOfRuleErrorMessage
> = ({ value, rule, path, schema, context }) => {
  const unpackedValues = rule.values.map((valueOrRef) => unpackRef(valueOrRef, path, context, schema.type).value);

  return unpackedValues.some((v) => v === value)
    ? undefined
    : {
        code: "one_of",
        values: rule.values,
        message: `The value ${value} is not a one of ${rule.values}`,
      };
};
