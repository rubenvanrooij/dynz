import { type Prettify, SchemaType } from "../../types";
import type { BooleanSchema } from "./types";

export function boolean(): BooleanSchema;
export function boolean<const T extends Omit<BooleanSchema, "type">>(
  value: T
): Prettify<T & Pick<BooleanSchema, "type">>;
export function boolean<A extends Omit<BooleanSchema, "type">>(value?: A): BooleanSchema {
  return {
    ...(value || {}),
    type: SchemaType.BOOLEAN,
  };
}
