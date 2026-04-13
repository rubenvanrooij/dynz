import type { ParamaterValue } from "../../functions";
import { type Prettify, SchemaType } from "../../types";
import type { ExpressionSchema } from "./types";

export const expression = <const T extends ParamaterValue, const A extends Omit<ExpressionSchema<T>, "type">>(
  value: A
): Prettify<A & Pick<ExpressionSchema<T>, "type">> => {
  return {
    ...value,
    type: SchemaType.EXPRESSION,
  };
};
