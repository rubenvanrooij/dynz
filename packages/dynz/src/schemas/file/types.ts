import type { CustomRule, MaxSizeRule, MimeTypeRule, MinSizeRule } from "../../shared-rules";
import type { BaseSchema, SchemaType } from "../../types";

export type FileRules = MinSizeRule | MaxSizeRule | MimeTypeRule | CustomRule;
export type FileSchema<TValue extends string | number = string | number> = BaseSchema<
  TValue,
  typeof SchemaType.FILE,
  FileRules
>;
