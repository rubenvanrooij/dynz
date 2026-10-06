import type { Rule } from "../../rules";
import type { BaseSchema, SchemaType } from "../../types";

export type FileSchema<TValue extends string | number = string | number> = BaseSchema<
  TValue,
  typeof SchemaType.FILE,
  Rule[]
>;
