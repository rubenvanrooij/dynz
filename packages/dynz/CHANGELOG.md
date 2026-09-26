# dynz

## 1.2.0

### Minor Changes

- f493c66: `discriminatedUnion()` now supports `.setDefault(...)`, matching `object()`/`array()`. Same prefault-style semantics: the default only fires when the union itself is entirely absent, and the discriminator key is required in the default value — it's what picks which member applies. Every other field of that member falls back to its own `.setDefault(...)` independently, exactly like a partial object default.

  ```ts
  discriminatedUnion("type", [
    { type: "email", email: string().setDefault("hello@example.com") },
    { type: "phone", phone: string() },
  ]).setDefault({ type: "email" });
  // validated with no input -> { type: "email", email: "hello@example.com" }
  ```

  Also fixes an unrelated, pre-existing bug found while implementing this: `ref()` into a discriminated union's member field (e.g. `ref("contact.email")`) returned the whole union object instead of the field's own value.

- a1a59b1: Fixed: a `ref()` to a discriminated union's discriminator (e.g. `ref("$.options.0.type")`)
  always resolved to `undefined`, so every predicate built on it was `false`. The
  discriminator had no schema of its own, so path lookups returned the union and the value
  failed its type check.

  `getNested`, `findSchemaByPath` and `findPossibleSchemasByPath` now resolve a
  discriminator path to an options schema listing every member's discriminator value. The
  same object is returned for every lookup of the same union.

  As a result `useOptions` works on a discriminator path and returns the variant choices,
  following ancestor unions as they switch. `useDiscriminatedUnionKeyValues` is removed from
  `@dynz/react-hook-form` and `@dynz/vue`: call `useOptions("<union>.<key>")` instead.

- f493c66: Fix `.setDefault(...)` so it actually applies. Previously a schema's `default` was only ever consulted when a _different_ field referenced it via `ref()` — the field itself never received its own default: a required field left empty still failed with `required`, and an optional field left empty simply had its key absent from `result.values`.

  `validate()` now falls back to a schema's `default` whenever a value is left empty (`undefined` or `null`), before the `required` check runs. Concretely:
  - A required field with a default, left empty, now validates successfully with the default in the output.
  - An optional field with a default, left empty, now has the default in `result.values` instead of being absent.
  - The default is validated against the field's own type and rules like any other value, so an invalid default (e.g. `string().min(5).setDefault("hi")`) now surfaces as a real error instead of being silently accepted.
  - A `ref()` to an empty field now resolves to the exact same value the field's own validation produces — previously the two could disagree.
  - `SchemaValues<T>` now treats a field with a static default as optional, matching the corrected runtime behavior.

  Also fixed: a `date()` default now survives a schema having been through `serialize()` and `JSON.parse()` — the default is coerced back into a `Date` wherever it's used (both for the field's own validation and for `ref()` resolution), independent of the field's `coerce` flag. A default is authored by the schema, not supplied by a caller, so it's always safe to normalize.

  Also fixed: `getNested`'s array-index fallback previously used the _array_ schema's own default (which has no fluent setter and was therefore always `undefined` in practice) instead of the _item_ schema's default when a specific array element was missing.

- a1a59b1: Fix `findSchemaByPath` resolving the wrong member of a discriminated union

  `findSchemaByPath` had no document to read, so at a discriminated union it returned the
  first member that happened to declare the requested field. For an array of unions this
  meant `$.items[0].amount` and `$.items[1].amount` resolved to the same schema no matter
  which variant each element actually was — silently, with no error.

  It now accepts the values the path is resolved against, and narrows the union to the
  member the document selects:

  ```ts
  findSchemaByPath("$.items[0].amount", schema, { values });
  findSchemaByPath("$.items[0].amount", schema, SchemaType.STRING, values);
  ```

  Values are a tie-breaker, not a filter: a path naming a field the selected member does
  not declare still resolves by scanning the other members, because adapters keep the
  outgoing variant's fields mounted for a render while a discriminator changes. A missing
  or wrong-shaped value never throws — it just stops narrowing.

  Calling without values is unchanged and still resolves to the first member declaring the
  field, so nothing breaks; pass values wherever you have them.

  Also adds `findPossibleSchemasByPath(path, schema)`, returning every schema a path could
  resolve to — one per reachable union member. Dependency collection needs this rather than
  narrowing: the set of fields to watch has to stay stable across a discriminator flip,
  since noticing that flip is what the watch is for. `getConditionDependencies` and
  `useConditionalProperty` now use it, fixing watches that previously missed a condition
  declared solely on a non-first variant.

  `useDynzField`, `useOptions` and `getOptions` now resolve against live values, so a field inside a union sees its own variant's schema.

  Resolving against values also means the resolved schema is a function of the union's
  discriminator, so the react-hook-form hooks now watch it. `useOptions` previously had no
  such watch and would render the outgoing variant's options after a variant switch; `useDynzField` was already covered by
  the `included`/`required`/`mutable` watches. The Vue composables track it automatically
  through `computed`.

- cb1ab83: Added `getIncludedPaths(schema, values)`, which walks a schema against a concrete `values` document and returns every path that's currently included — object/array/discriminated-union containers as well as their descendants — each annotated with its schema `type` and resolved `required`/`mutable` state.

  Array paths follow the actual number of items present in `values`, and a discriminated union is only walked into its currently matching member. If a container path is excluded (or a discriminated union has no matching member), none of its descendants are walked or included in the result — so every returned path is genuinely reachable, and a consumer can safely discard everything under an excluded container.

  ```ts
  const schema = object({
    name: string(),
    address: object({ street: string() }).setIncluded(eq("name", "known")),
  });

  getIncludedPaths(schema, { name: "known" });
  // [
  //   { path: "$.name", type: "string", required: true, mutable: true },
  //   { path: "$.address", type: "object", required: true, mutable: true },
  //   { path: "$.address.street", type: "string", required: true, mutable: true },
  // ]
  ```

- 84a8799: Added `getOptions(name, schema, values)` and `getOptionsForSchema(schema, path, rootSchema, values)` to `dynz` — the framework-agnostic core of what each integration's `useOptions` hook/composable does: resolving an `options()` field's entries into `{ value, enabled }` pairs, where a dynamic entry's `enabled` predicate is resolved against `values`.

  ```ts
  getOptions("plan", schema, { hasSubscription: false });
  // [
  //   { value: "free", enabled: true },
  //   { value: "pro", enabled: false },
  // ]
  ```

  `@dynz/vue`'s `useOptions` now delegates to `getOptionsForSchema`, fixing a bug where a dynamic option's `enabled` predicate always resolved relative refs (`ref(...)`) against the schema root instead of the options field's own position — wrong for any options field nested inside an `object({...})`/`array(...)`, since a relative ref inside that predicate is meant to resolve against its siblings.

  `@dynz/react-hook-form`'s `useOptions`/`useOptionsSchema` (already correct) now delegate to the same shared helper instead of duplicating the resolution logic — no behavior change.

- 1cbf2fc: Added a `notEquals(value, code?)` rule, the inverse of `equals()`, to `string()`, `number()`, `boolean()`, `enum()`, and `options()` schemas. Like `equals()`, the expected value can be a static value or a `ref()` to another field.

  ```ts
  string().notEquals(v("banned"));
  string().notEquals(ref("oldPassword")); // new password must differ from the old one
  ```

  `@dynz/to-json-schema` converts a static `notEquals` rule to `{ not: { const: value } }`.

- 1cbf2fc: Exposed `notOneOf(values, code?)`, the inverse of `oneOf()`, on `string()`, `number()`, `enum()`, and `options()` schemas. The `not_one_of` rule already existed internally (and was already handled by `@dynz/to-json-schema`, converting to `{ not: { enum: [...] } }`), but had no fluent method to create it.

  ```ts
  string().notOneOf([v("admin"), v("root")]);
  ```

- f493c66: `object()` and `array()` now support `.setDefault(...)`, matching the other six schema kinds.

  Composite defaults use prefault-style semantics, not a verbatim, all-or-nothing substitute: if the object/array itself is left empty, the default is substituted and then handed to completely ordinary validation. Any field the default doesn't mention still applies its own `.setDefault(...)` independently, exactly as it would for a genuinely-submitted partial object — `.setDefault({})` is a valid, common pattern for "materialize the object so its fields' own defaults can run." A default only ever affects a field once that field is genuinely absent from the input; a partially-submitted object never has the object-level default merged into it.

  ```ts
  object({
    foo: string().optional().setDefault("foo"),
    bar: string().optional().setDefault("bar"),
  }).setDefault({});
  // validated with no input -> { foo: "foo", bar: "bar" }
  ```

  Also: a `Date` nested inside a composite default — at any depth — now survives a schema having gone through `serialize()` and `JSON.parse()`, the same guarantee bare `date()` defaults already had. The repair work is memoized per schema (`WeakMap`, keyed by schema identity), so it's paid once per schema rather than once per substitution — notably, once for an array item schema shared across every item, not once per item.

- b33b5d0: Private fields now work end to end: the server masks them, the form shows the mask, untouched fields go back as their mask marker, and `validate` swaps the stored value back in.
  - New `maskPrivateValues(schema, values, { maskers })` for the server → client payload. `setPrivate({ mask: "last4" })` names a masker (the schema stays serializable); `setPrivate(true)` uses `"***"`.
  - `validate(schema, currentValues, input)` resolves each masked value to the stored value, so `result.values` is a plain document ready to persist. A masked value with nothing stored fails with the new `masked` error code. Without `currentValues` (client side), masked values are skipped and passed through.
  - A raw value is now accepted for a private field (treated as `plain(value)`).
  - `ref()`s and conditions see a private field's plain value.
  - Errors never contain a private field's value: `value`/`current` are cleared and the value is scrubbed from the message.
  - New `toFormValues` / `toSubmitValues` helpers. `@dynz/react-hook-form` and `@dynz/vue` apply them automatically when you pass the masked payload as `currentValues`.
  - `@dynz/to-json-schema`: private fields are wrapped only in `"input"` mode (now also accepting the raw value); `"output"` mode emits the plain schema.
  - Fixed: `mask(0)` / `mask("")` passed `undefined` to the mask function.
  - `isPivateValue` is renamed to `isPrivateValue` (the old name is kept as a deprecated alias).

  **Behaviour changes for private fields.** The previous behaviour could not be used in practice: an omitted optional private field threw, and nested private fields were mistyped. Still, note:
  - `SchemaValues<T>` is now plain (no `PrivateValue` wrapper). Use the new `SchemaInput<T>` for submissions.
  - `currentValues` are plain stored values. Wrapped `plain(x)` values are still accepted at runtime.
  - `setPrivate` is only available on leaf schemas. Objects, arrays, discriminated unions and expressions can no longer be private.

- d2e3e68: Every schema builder now supports metadata via `.setMeta(...)` and `.describe(...)`:

  ```ts
  string()
    .setMeta({ id: "userName", title: "User name", deprecated: true })
    .describe("The user's display name");
  // schema.meta -> { id: "userName", title: "User name", deprecated: true, description: "The user's display name" }
  ```

  `.setMeta(...)` shallow-merges into any existing metadata (so `.describe(...)` after `.setMeta({ id })` keeps the `id`), and accepts arbitrary custom keys alongside the built-in `id`/`title`/`description`/`deprecated`.

  `@dynz/to-json-schema` now carries this metadata over into the generated JSON Schema: `title`, `description`, and `deprecated` map onto the same-named keywords, `id` maps to the standard `$id` keyword, and any custom keys pass through as-is.

### Patch Changes

- f493c66: Fixed: `ref()` (and expressions built on it) could resolve the wrong value when an `object()`/`array()`/`discriminatedUnion()` had its own `.setDefault(...)` and was itself entirely absent — it would fall back to a field's own default (or `undefined`) instead of the value the container's default actually supplies for that field.

  ```ts
  const schema = object({
    name: string().setDefault("jan"),
    surname: string(),
    nameSize: expr(size(ref("name"))),
  }).setDefault({ name: "kees", surname: "van Rooij" });

  await validate(schema, undefined, undefined);
  // name/surname were already correct ("kees"/"van Rooij"); nameSize now correctly
  // resolves to 4 ("kees".length) instead of 3 ("jan".length)
  ```

  Also fixes the same class of gap for a discriminated union's member field: `ref()` into a present union's member field now falls back to that field's own default when the field itself is absent, instead of returning `undefined`.

## 1.1.0

### Minor Changes

- c8effd5: added discriminated union schema

## 1.0.0

### Major Changes

- 11ba2bb: fixed issue with options schema values inference

### Patch Changes

- fa23320: removed log

## 0.0.19

### Patch Changes

- 5ab0409: added pluck function to extract nested array properties
- 5ab0409: feat: added atan function

## 0.0.18

### Patch Changes

- c704855: added includes and not-includes rules to string an array schema
- e2b2fd0: renamed rules builder names to remove ambuigity between rules/functions
- 5e37967: added literal schema
- b1bc4bf: fixed issue with tan function calling Math.sin instead of Math.tan
- 594b3c9: removed date string schema

## 0.0.17

### Patch Changes

- 345cf20: fixed issue with fluentAPI and setting ui props

## 0.0.16

### Patch Changes

- 873ed04: removed the object API and replaced it with the new fluent api

## 0.0.15

### Patch Changes

- dc4eb75: added function support to dynz

## 0.0.14

### Patch Changes

- 8cbba32: fixed issue where options of an option schema were not properly infered by the SchemaValues utility

## 0.0.13

### Patch Changes

- 6bdc69e: Added sophisiticated gte/lte/gt/lt condition validation for arrays/files/dates

## 0.0.12

### Patch Changes

- 03a0ce1: Added null support

## 0.0.11

### Patch Changes

- cfb915a: fixed build issues

## 0.0.10

### Patch Changes

- 93e08c7: fixed issue where non required undefined values caused type check issues

## 0.0.9

### Patch Changes

- 494ea14: added extra react helpers for managing dependencies + utility components/hooks for easier integration

## 0.0.8

### Patch Changes

- 6b5db9c: added dependency map generation to use in form libraries for optimizing triggers / re-renders

## 0.0.7

### Patch Changes

- 6332c4c: fixed issue with not equals condition

## 0.0.6

### Patch Changes

- 74fce85: Date string schema added

## 0.0.5

### Patch Changes

- d8b5c94: Added option type validation
- 955bef4: Added enum schema
- 17c9e07: added correct logic for array inner schema mutability
- 982b034: fixed issue with absolute path determination
- d863166: Added schema unit tests

## 0.0.4

### Patch Changes

- 0dec073: fixed typo
- 5aff140: Major refactor of the codebase
- fd7197c: refactor

## 0.0.3

### Patch Changes

- 7fbff7a: Added correct messages to max rule validation errors

## 0.0.2

### Patch Changes

- new version
