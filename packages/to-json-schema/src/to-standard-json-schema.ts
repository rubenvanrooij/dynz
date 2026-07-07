import type { Schema } from "dynz";
import { convertSchema } from "./convert-schema";
import type { ConversionConfig, JsonSchema } from "./types";

/**
 * Converts a dynz schema to a standard JSON Schema (2020-12) document.
 *
 * Rule values that depend on runtime data (references, predicates,
 * transformers) and schema kinds without a JSON Schema equivalent are
 * handled according to `config.errorMode` (default `"warn"`).
 */
export function toStandardJsonSchema<T extends Schema>(schema: T, config: ConversionConfig = {}): JsonSchema {
  const jsonSchema = convertSchema(schema, { errorMode: config.errorMode ?? "warn" });
  return { $schema: "https://json-schema.org/draft/2020-12/schema", ...jsonSchema };
}
