import { type Prettify, type Schema, SchemaType } from "../../types";
import type { ArraySchema } from "./types";

export const array = <const T extends Schema, const A extends Omit<ArraySchema<T>, "type">>(
  value: A
): Prettify<A & Pick<ArraySchema<T>, "type">> => {
  return {
    ...value,
    type: SchemaType.ARRAY,
  };
};
