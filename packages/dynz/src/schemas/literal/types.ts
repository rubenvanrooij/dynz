import type { BaseSchema, PrivateSchema, SchemaType } from "../../types";

export type LiteralValue = string | number | boolean | null;

export type LiteralSchema<T extends LiteralValue = LiteralValue> = BaseSchema<T, typeof SchemaType.LITERAL, never> &
  PrivateSchema & {
    value: T;
  };
