import { type Prettify, type Schema, SchemaType } from "../../types";
import type { ObjectSchema } from "./types";

export const object = <const T extends Record<string, Schema>, const A extends Omit<ObjectSchema<T>, "type">>(
  value: A
): Prettify<A & Pick<ObjectSchema<T>, "type">> => {
  return {
    ...value,
    type: SchemaType.OBJECT,
  };
};
