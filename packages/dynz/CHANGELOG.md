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

- f493c66: Fix `.setDefault(...)` so it actually applies. Previously a schema's `default` was only ever consulted when a _different_ field referenced it via `ref()` — the field itself never received its own default: a required field left empty still failed with `required`, and an optional field left empty simply had its key absent from `result.values`.

  `validate()` now falls back to a schema's `default` whenever a value is left empty (`undefined` or `null`), before the `required` check runs. Concretely:
  - A required field with a default, left empty, now validates successfully with the default in the output.
  - An optional field with a default, left empty, now has the default in `result.values` instead of being absent.
  - The default is validated against the field's own type and rules like any other value, so an invalid default (e.g. `string().min(5).setDefault("hi")`) now surfaces as a real error instead of being silently accepted.
  - A `ref()` to an empty field now resolves to the exact same value the field's own validation produces — previously the two could disagree.
  - `SchemaValues<T>` now treats a field with a static default as optional, matching the corrected runtime behavior.

  Also fixed: a `date()` default now survives a schema having been through `serialize()` and `JSON.parse()` — the default is coerced back into a `Date` wherever it's used (both for the field's own validation and for `ref()` resolution), independent of the field's `coerce` flag. A default is authored by the schema, not supplied by a caller, so it's always safe to normalize.

  Also fixed: `getNested`'s array-index fallback previously used the _array_ schema's own default (which has no fluent setter and was therefore always `undefined` in practice) instead of the _item_ schema's default when a specific array element was missing.

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
