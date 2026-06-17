import type { ParamaterValue } from "../../functions";
import type { Rule } from "../../rules";
import type { BaseSchema, PrivateSchema, SchemaType } from "../../types";

export type ExpressionSchema<T extends ParamaterValue = ParamaterValue> = BaseSchema<
  unknown,
  typeof SchemaType.EXPRESSION,
  Rule[]
> &
  PrivateSchema & { coerce?: boolean } & {
    value: T;
  };
