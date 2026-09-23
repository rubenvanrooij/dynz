import type { DiscriminatedUnionSchema, OptionsSchema } from "../schemas";
import { SchemaType } from "../types";

/**
 * Cached by union so every lookup of the same discriminator returns the same object —
 * `findPossibleSchemasByPath` dedupes candidates by identity, and hooks memoise on it.
 */
const cache = new WeakMap<DiscriminatedUnionSchema<string, never>, OptionsSchema>();

/**
 * The schema of a union's discriminator field. Members declare the discriminator as a
 * literal, so it has no schema of its own; this synthesises an options schema listing
 * every member's discriminator value — the set of valid choices.
 */
export function discriminantSchema(union: DiscriminatedUnionSchema<string, never>): OptionsSchema {
  const cached = cache.get(union);

  if (cached !== undefined) {
    return cached;
  }

  const schema: OptionsSchema = {
    type: SchemaType.OPTIONS,
    options: union.schemas.map((member) => member[union.key] as string | number | boolean),
  };

  cache.set(union, schema);

  return schema;
}
