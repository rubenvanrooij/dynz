import type { ParamaterValue } from "../../functions";
import type { BaseSchema, PrivateSchema, SchemaType } from "../../types";

export type ExpressionSchema<T extends ParamaterValue = ParamaterValue> = BaseSchema<
  unknown,
  typeof SchemaType.EXPRESSION,
  never
> &
  PrivateSchema & { coerce?: boolean } & {
    value: T;
  };
