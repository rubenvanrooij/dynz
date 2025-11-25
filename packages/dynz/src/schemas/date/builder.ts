import { type Prettify, SchemaType } from "../../types";
import type { DateSchema } from "./types";

export function date(): DateSchema;
export function date<const T extends Omit<DateSchema, "type">>(value: T): Prettify<T & Pick<DateSchema, "type">>;
export function date<A extends Omit<DateSchema, "type">>(value?: A): DateSchema {
  return {
    ...(value || {}),
    type: SchemaType.DATE,
  };
}
