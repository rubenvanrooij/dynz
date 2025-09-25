import type { BaseSchema, CustomRule, MaxRule, MimeTypeRule, MinRule, Reference, SchemaType } from "../../types";

export type FileRules = MinRule<number | Reference> | MaxRule<number | Reference> | MimeTypeRule | CustomRule;
export type FileSchema<TValue extends string | number = string | number> = BaseSchema<
  TValue,
  typeof SchemaType.FILE,
  FileRules
>;
