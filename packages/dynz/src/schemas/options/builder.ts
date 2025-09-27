import { type Prettify, SchemaType } from "../../types";
import type { OptionsSchema } from "./types";

export function options<const T extends Omit<OptionsSchema, "type">>(
  value: T
): Prettify<T & Pick<OptionsSchema, "type">> {
  return {
    ...(value || {}),
    type: SchemaType.OPTIONS,
  };
}
