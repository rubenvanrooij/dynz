import { type Prettify, SchemaType } from "../../types";
import type { NumberSchema } from "./types";

export function number(): NumberSchema;
export function number<const T extends Omit<NumberSchema, "type">>(value: T): Prettify<T & Pick<NumberSchema, "type">>;
export function number<const A extends Omit<NumberSchema, "type">>(value?: A): NumberSchema {
  return {
    ...(value || {}),
    type: SchemaType.NUMBER,
  };
}
