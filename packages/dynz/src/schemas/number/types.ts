import type { Rule } from "../../rules";
import type { BaseSchema, SchemaType } from "../../types";

export type NumberSchema = BaseSchema<number, typeof SchemaType.NUMBER, Rule[]> & {
  coerce?: boolean;
};
