import type { Predicate } from "../../functions";
import type { Rule } from "../../rules";
import type { Unpacked } from "./../../types";
import type { BaseSchema, SchemaType } from "../../types";

export type DynamicOptionValue = { enabled: Predicate | boolean; value: OptionValue };
export type OptionValue = string | number | boolean | DynamicOptionValue;
export type OptionsValue = OptionValue[];

/**
 * ENUM SCHEMA
 */
export type OptionsSchema<TOptions extends OptionsValue = OptionsValue> = BaseSchema<
  Unpacked<TOptions>,
  typeof SchemaType.OPTIONS,
  Rule
> & {
  options: TOptions;
};
