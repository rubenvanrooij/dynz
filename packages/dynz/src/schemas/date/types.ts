import type { Rule } from "../../rules";
import type { BaseSchema, SchemaType } from "../../types";

export type DateSchema = BaseSchema<Date, typeof SchemaType.DATE, Rule[]> & {
  coerce?: boolean;
};
