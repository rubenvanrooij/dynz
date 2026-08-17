import { type Schema, SchemaType, type SchemaValues } from "../types";
import { withDefault } from "../utils";
import type { DeepPartial } from "./types";

/**
 * Resolves the "empty document" shape of a schema: fills in every default
 * (including nested ones), and omits everything else — even fields that are
 * otherwise `required`. Uses the same resolution `validate()` uses internally
 * (`withDefault`), just with no input document.
 *
 * Useful for pre-populating form state before the user has touched anything.
 *
 * ```ts
 * const schema = object({
 *   theme: options(["light", "dark"] as const).setDefault("light"),
 *   profile: object({ bio: string().setDefault("") }),
 * });
 *
 * getDefaultValues(schema); // { theme: "light", profile: { bio: "" } }
 * ```
 *
 * Not handled, since there's no real document to evaluate against:
 * - Conditional `required`/`included`/`mutable` predicates aren't evaluated
 *   (no values context) — every field is walked unconditionally.
 * - Arrays and discriminated unions with no default of their own contribute
 *   nothing (no principled item count or discriminator to pick).
 * - A partial object/union default is used as-is, not merged with deeper
 *   per-field defaults — same one-shot `withDefault` resolution as
 *   `validate()`, without its recursive repair for a single position.
 * - A private field's default comes back unwrapped (plain value, not
 *   `{ state, value }`) — wrap it yourself if feeding it back into `validate()`.
 */
export function getDefaultValues<T extends Schema>(schema: T): DeepPartial<SchemaValues<T>> {
  return resolveDefaultShape(schema) as DeepPartial<SchemaValues<T>>;
}

function resolveDefaultShape(schema: Schema): unknown {
  // Same resolution validate() would substitute if this exact position were left
  // empty — already recursively repairs a Date nested inside a composite default.
  const ownDefault = withDefault(schema, undefined);
  if (ownDefault !== undefined) {
    return ownDefault;
  }

  // A literal has exactly one possible value; it's not "defaulted" in the sense of an
  // authored fallback, but it's no less deterministic than one.
  if (schema.type === SchemaType.LITERAL) {
    return schema.value;
  }

  if (schema.type === SchemaType.OBJECT) {
    const result: Record<string, unknown> = {};
    let hasAny = false;

    for (const [key, fieldSchema] of Object.entries(schema.fields)) {
      const value = resolveDefaultShape(fieldSchema);

      if (value !== undefined) {
        result[key] = value;
        hasAny = true;
      }
    }

    // Nothing anywhere inside had a default either — contribute nothing, rather than
    // an empty object no caller asked for.
    return hasAny ? result : undefined;
  }

  // Arrays, discriminated unions and expressions have no principled "empty document"
  // shape without a default of their own: an array has no items to walk without real
  // data, a discriminated union has no way to pick a member, and an expression is
  // computed, not stored — see the caveats above.
  return undefined;
}
