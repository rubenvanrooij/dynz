import type {
  BaseSchema,
  CustomRule,
  EqualsRule,
  MaxPrecisionRule,
  MaxRule,
  MinRule,
  OneOfRule,
  Reference,
  SchemaType,
} from "../../types";

/**
 * NUMBER SCHEMA
 */
export type NumberRules =
  | MinRule<number | Reference>
  | MaxRule<number | Reference>
  | MaxPrecisionRule
  | EqualsRule<number | Reference>
  | CustomRule
  | OneOfRule<Array<number | Reference>>;

export type NumberSchema = BaseSchema<number, typeof SchemaType.NUMBER, NumberRules> & {
  coerce?: boolean;
};
