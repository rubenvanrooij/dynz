import type { BaseSchema, CustomRule, MaxSizeRule, MimeTypeRule, MinSizeRule, SchemaType } from "../../types";

export type FileRules = MinSizeRule | MaxSizeRule | MimeTypeRule | CustomRule;
export type FileSchema<TValue extends string | number = string | number> = BaseSchema<
  TValue,
  typeof SchemaType.FILE,
  FileRules
>;
