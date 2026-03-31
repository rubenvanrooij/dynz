import type { ParamaterValue } from "../../functions";
import type { BaseSchema, PrivateSchema, SchemaType } from "../../types";

export type ExpressionSchema<T extends ParamaterValue = ParamaterValue> = Omit<
  BaseSchema<unknown, typeof SchemaType.EXPRESSION, never>,
  "required" | "mutable"
> &
  PrivateSchema & { coerce?: boolean } & {
    value: T;
  };
