import type { Rule } from "../../rules";
import type { BaseSchema, PrivateSchema, SchemaType } from "../../types";

/**
 * BOOLEAN SCHEMA
 */
export type BooleanSchema = BaseSchema<boolean, typeof SchemaType.BOOLEAN, Rule[]> &
  PrivateSchema & {
    coerce?: boolean;
  };
