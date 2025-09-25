import { type Prettify, SchemaType } from "../../types";
import type { FileSchema } from "./types";

export function file(): FileSchema;
export function file<const T extends Omit<FileSchema, "type">>(value: T): Prettify<T & Pick<FileSchema, "type">>;
export function file<A extends Omit<FileSchema, "type">>(value?: A): FileSchema {
  return {
    ...(value || {}),
    type: SchemaType.FILE,
  };
}
