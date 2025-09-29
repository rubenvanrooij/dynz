import { type Prettify, SchemaType } from "../../types";
import type { StringSchema } from "./types";

export function string(): StringSchema;
export function string<const T extends Omit<StringSchema, "type">>(value: T): Prettify<T & Pick<StringSchema, "type">>;
export function string<const T extends Omit<StringSchema, "type">>(value?: T): StringSchema {
  return {
    ...(value || {}),
    type: SchemaType.STRING,
  };
}
