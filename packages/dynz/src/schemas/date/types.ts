import type { Rule } from "../../rules";
import type { BaseSchema, PrivateSchema, SchemaType } from "../../types";

export type DateSchema = BaseSchema<Date, typeof SchemaType.DATE, Rule[]> &
  PrivateSchema & {
    coerce?: boolean;
  };
