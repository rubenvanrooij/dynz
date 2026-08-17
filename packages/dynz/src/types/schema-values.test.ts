import { describe, expectTypeOf, it } from "vitest";
import { array, number, object, string } from "../schemas";
import type { SchemaValues } from "./schema";

/**
 * `SchemaValues<T>` treats a field as optional the moment it can no longer prove the
 * field is truly mandatory — and a field with a static `.setDefault(...)` is no longer
 * truly mandatory, because `validate()` now fills it in when it's left empty (see
 * `withDefault`). These are compile-time-only assertions; nothing here executes.
 *
 * Every property below is `readonly`: `object()`'s `TFields` is a `const` type
 * parameter, so the fields object literal infers as if written `as const` — unrelated
 * to defaults, just part of the shape any assertion here has to match.
 */
describe("SchemaValues<T> and defaults", () => {
  it("keeps a plain required field mandatory", () => {
    const schema = object({ name: string().setRequired(true) });

    expectTypeOf<SchemaValues<typeof schema>>().toEqualTypeOf<{ readonly name: string }>();
  });

  it("makes a required field with a default optional", () => {
    // Required is the implicit state here — no .setRequired(true) needed, and the
    // default should still make it omittable.
    const schema = object({ name: string().setDefault("Anonymous") });

    expectTypeOf<SchemaValues<typeof schema>>().toEqualTypeOf<{ readonly name?: string | undefined }>();
  });

  it("leaves an already-optional field's type unchanged when it also has a default", () => {
    const schema = object({ count: number().optional().setDefault(42) });

    expectTypeOf<SchemaValues<typeof schema>>().toEqualTypeOf<{ readonly count?: number | undefined }>();
  });

  it("keeps a conditionally-required field optional regardless of a default", () => {
    const schema = object({
      plan: string(),
      companyName: string().setRequired(false).setDefault("n/a"),
    });

    expectTypeOf<SchemaValues<typeof schema>>().toEqualTypeOf<{
      readonly plan: string;
      readonly companyName?: string | undefined;
    }>();
  });

  it("does not widen a field once it has been passed through Object.entries (no exact literal type)", () => {
    const schema = object({ name: string().setDefault("Anonymous") });

    for (const [, fieldSchema] of Object.entries(schema.fields)) {
      // `fieldSchema` here is widened to the generic `Schema` union — HasDefault must
      // stay `false` for it, the same conservative direction IsRequired/IsIncluded
      // already take once a schema's exact literal type isn't statically known.
      expectTypeOf<SchemaValues<typeof fieldSchema>>().not.toBeAny();
    }
  });

  it("makes a defaulted item type's array elements optional too, matching a plain .optional() item", () => {
    // Consistent with how the *existing* MakeOptional/IsOptionalField machinery already
    // treated a plain `.optional()` item before this change — not a new kind of
    // imprecision, just the same one now correctly reached via a default too. An item
    // left `undefined` in a submitted array is exactly the case withDefault fills in.
    const schema = object({ tags: array(string().setDefault("n/a")) });

    expectTypeOf<SchemaValues<typeof schema>>().toEqualTypeOf<{ readonly tags: (string | undefined)[] }>();
  });

  it("does not affect an array item with no default", () => {
    const schema = object({ tags: array(string()) });

    expectTypeOf<SchemaValues<typeof schema>>().toEqualTypeOf<{ readonly tags: string[] }>();
  });
});
