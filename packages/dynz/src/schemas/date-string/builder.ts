import { type Optional, type Prettify, SchemaType } from "../../types";
import type { DateStringSchema } from "./types";

export const DEFAULT_DATE_STRING_FORMAT = "yyyy-MM-dd";

export function dateString(): DateStringSchema;
export function dateString<
  const T extends string,
  const A extends Optional<Omit<DateStringSchema<T>, "type">, "format">,
>(value: A): Prettify<A & Pick<DateStringSchema<T>, "format"> & Pick<DateStringSchema<T>, "type">>;
export function dateString<
  const T extends string,
  const A extends Optional<Omit<DateStringSchema<T>, "type">, "format">,
>(value?: A): DateStringSchema {
  return {
    ...value,
    format: value?.format || DEFAULT_DATE_STRING_FORMAT,
    type: SchemaType.DATE_STRING,
  };
}
