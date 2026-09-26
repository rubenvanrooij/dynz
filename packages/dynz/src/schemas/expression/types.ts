import type { ParamaterValue } from "../../functions";
import type { BaseSchema, SchemaType } from "../../types";

export type ExpressionSchema<T extends ParamaterValue = ParamaterValue> = BaseSchema<
  unknown,
  typeof SchemaType.EXPRESSION,
  never
> & { coerce?: boolean } & {
  value: T;
};
