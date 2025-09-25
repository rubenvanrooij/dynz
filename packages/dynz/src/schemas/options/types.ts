import type { BaseSchema, CustomRule, EqualsRule, SchemaType } from "../../types";

/**
 * ENUM SCHEMA
 */
export type OptionsRules = EqualsRule<string | number> | CustomRule;
export type OptionsSchema<TValue extends string | number = string | number> = BaseSchema<
  TValue,
  typeof SchemaType.OPTIONS,
  OptionsRules
> & {
  values: TValue[];
};
