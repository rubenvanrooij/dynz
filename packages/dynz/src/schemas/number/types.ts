import type { Rule } from "../../rules";
import type { BaseSchema, PrivateSchema, SchemaType } from "../../types";

export type NumberSchema = BaseSchema<number, typeof SchemaType.NUMBER, Rule[]> &
  PrivateSchema & {
    coerce?: boolean;
  };
