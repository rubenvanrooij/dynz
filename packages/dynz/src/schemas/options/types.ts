import type { CustomRule, EqualsRule } from "../../rules";
import type { Unpacked } from "./../../types";
import type { BaseSchema, SchemaType } from "../../types";

export type OptionValue = string | number;
export type OptionsValue = OptionValue[];

/**
 * ENUM SCHEMA
 */
export type OptionsRules = EqualsRule<OptionValue> | CustomRule;
export type OptionsSchema<TOptions extends OptionsValue = OptionsValue> = BaseSchema<
  Unpacked<TOptions>,
  typeof SchemaType.OPTIONS,
  OptionsRules
> & {
  options: TOptions;
};
