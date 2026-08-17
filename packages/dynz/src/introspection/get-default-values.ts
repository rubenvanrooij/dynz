import { type Schema, SchemaType, type SchemaValues } from "../types";
import { withDefault } from "../utils";
import type { DeepPartial } from "./types";

/**
 * Recursively resolves the "empty document" shape of a schema: every position that has
 * a default — its own, or one belonging to something nested inside it — is filled in;
 * everything else is left out entirely, including fields that are otherwise `required`
 * but have no default anywhere to satisfy that with.
 *
 * This is the same resolution `validate()` uses internally (`withDefault`, including
 * its recursive repair of a `Date` nested inside a composite default), just run without
 * an input document to validate — there's nothing to leave alone here, so every default
 * that exists gets surfaced, at every depth, regardless of whether an ancestor object
 * or array happens to have a `.setDefault()` of its own.
 *
 * The primary use case is a frontend (or any other consumer) wanting to pre-populate
 * form state before the user has touched anything — call this once, use the result as
 * the initial values, and hand the same shape to `validate()` later.
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
 * A few things this deliberately does **not** attempt, since none of them have a sound
 * answer without an actual document to evaluate against:
 * - **Conditional `required`/`included`/`mutable` predicates are not evaluated.** There
 *   is no values context for them to reference, so every field is walked unconditionally
 *   — this can surface a default that would end up excluded once real data exists.
 * - **Arrays and discriminated unions with no default of their own contribute
 *   nothing.** There's no principled number of items to invent for an array, and no
 *   discriminator value to pick a union member with — `.setDefault(...)` (an empty
 *   array, or a union default that at least sets the discriminator) is what makes
 *   either show up here at all. A per-item default only ever fills a gap in an array
 *   that already has items, which none do here.
 * - **A default that's a partial object/union literal is used exactly as written, not
 *   merged with anything deeper.** This differs from `validate()`, which recurses
 *   through completely ordinary validation once a default is substituted, letting a
 *   field's own default fill gaps the parent's default doesn't mention. This function
 *   only ever calls the same one-shot resolution `validate()` uses for a *single*
 *   position (`withDefault`) — it doesn't run that recursion. A partial default here
 *   (e.g. `object({ foo, bar }).setDefault({ foo: "x" })`, or a union default that
 *   only sets the discriminator) surfaces exactly what it says and nothing more, even
 *   if `bar`/other member fields have their own `.setDefault(...)`. Fields nested
 *   inside a container with *no* default of its own don't hit this: they're reached by
 *   this function's own recursion instead, which does walk into each one individually.
 * - **A private field's default comes back unwrapped**, the same shape it's declared
 *   in (`.setDefault(value)` takes the plain value, not `{ state, value }`) — wrap it
 *   yourself (see `plain()`) if you need to feed it back into `validate()`'s input.
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
