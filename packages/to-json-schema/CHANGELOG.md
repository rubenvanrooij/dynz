# @dynz/to-json-schema

## 0.1.0

### Minor Changes

- d2e3e68: Every schema builder now supports metadata via `.setMeta(...)` and `.describe(...)`:

  ```ts
  string()
    .setMeta({ id: "userName", title: "User name", deprecated: true })
    .describe("The user's display name");
  // schema.meta -> { id: "userName", title: "User name", deprecated: true, description: "The user's display name" }
  ```

  `.setMeta(...)` shallow-merges into any existing metadata (so `.describe(...)` after `.setMeta({ id })` keeps the `id`), and accepts arbitrary custom keys alongside the built-in `id`/`title`/`description`/`deprecated`.

  `@dynz/to-json-schema` now carries this metadata over into the generated JSON Schema: `title`, `description`, and `deprecated` map onto the same-named keywords, `id` maps to the standard `$id` keyword, and any custom keys pass through as-is.

- 836ade0: Added `strict` and `unionKeyword` options to `toStandardJsonSchema`, for compatibility with LLM structured-output "strict" modes (OpenAI `strict: true`, Anthropic's native structured output).

  **`strict`** (defaults to `true`): every object node gets `additionalProperties: false` and a complete `required` list — a property that isn't otherwise mandatory has its schema widened to also accept `null` (via `anyOf`), since strict mode has no other way to express "may be absent". `literal()` fields, and the discriminator key of a `discriminatedUnion()`, also get an inferred `type` (strict mode requires `type` everywhere).

  ```ts
  toStandardJsonSchema(object({ name: string(), age: number().optional() }));
  // {
  //   type: "object",
  //   additionalProperties: false,
  //   properties: { name: { type: "string" }, age: { anyOf: [{ type: "number" }, { type: "null" }] } },
  //   required: ["name", "age"],
  // }
  ```

  Since this changes the default output shape, pass `strict: false` to reproduce the previous (pre-this-release) output exactly.

  **`unionKeyword`** (defaults to `"oneOf"`): controls the keyword used for every schema-selection union this package emits — `discriminatedUnion()` members, and the plain/masked wrapper for `.setPrivate(true)` fields. Some strict-mode consumers (e.g. Anthropic's structured output) reject `oneOf` outright and require `anyOf` instead:

  ```ts
  toStandardJsonSchema(schema, { unionKeyword: "anyOf" });
  ```

### Patch Changes

- 29139eb: Added calendar date functions and rules. All calendar math is done in UTC, so results are the same on the server and in the browser.
  - Transformers: `dateAdd(date, amount, unit)`, `dateDiff(left, right, unit)`, `startOf(date, unit)`, `endOf(date, unit)`. `unit` is `"day" | "month" | "year"`.
  - Predicates (for conditions): `sameCalendar(left, right, unit)`, `isFirstDayOf(date, unit)`, `isLastDayOf(date, unit)` (`unit` is `"month" | "year"`).
  - Date rules: `date().sameCalendar(date, unit, code?)` and `date().firstDayOf(unit, code?)`, `date().lastDayOf(unit, code?)`.
  - A generic `satisfies(predicate, code?)` rule on all schemas, which fails when the predicate evaluates to `false`.

  ```ts
  object({
    startDate: date().firstDayOf("month"),
    endDate: date()
      .min(dateAdd(ref("startDate"), 3, "month"))
      .satisfies(lte(dateDiff(ref("endDate"), ref("startDate"), "month"), 12)),
    payDate: date().sameCalendar(ref("startDate"), "year", "SAME_YEAR"),
    proRataReason: string().setRequired(
      eq(isFirstDayOf(ref("startDate"), "month"), false),
    ),
  });
  ```

  Fixes:
  - `eq`/`neq` and the `equals`/`notEquals` rules now compare dates by instant instead of by reference. This includes a static date that became an ISO string after `serialize()`.
  - `gt`/`gte`/`lt`/`lte` accept `Date` operands.
  - `getRulesDependencies` and `getRulesDependenciesMap` now read the rules of the field at the given path instead of the root schema's rules. Before this fix, field-level rules were missing from the dependency map, so the react-hook-form and vue integrations did not re-validate dependent fields.
  - Rule dependencies now include references nested inside functions, e.g. `after(dateAdd(ref("startDate"), 1, "day"))`.
  - `before` rule threw an error message mentioning `afterRule`.

  `@dynz/to-json-schema` reports `satisfies`, `same_calendar` and `boundary_day` as having no JSON Schema equivalent.

- f493c66: A field with a static `default` is no longer listed in the generated JSON Schema's `required` array. Previously a required-by-default field with a `.setDefault(...)` was both required _and_ defaulted in the generated schema — a contradiction most JSON Schema / OpenAPI tooling reads as "omit me and this is what you get" vs. "you must supply me", and one that no longer matches `dynz`'s corrected runtime behavior (a static default now satisfies `required`).
- 1cbf2fc: Added a `notEquals(value, code?)` rule, the inverse of `equals()`, to `string()`, `number()`, `boolean()`, `enum()`, and `options()` schemas. Like `equals()`, the expected value can be a static value or a `ref()` to another field.

  ```ts
  string().notEquals(v("banned"));
  string().notEquals(ref("oldPassword")); // new password must differ from the old one
  ```

  `@dynz/to-json-schema` converts a static `notEquals` rule to `{ not: { const: value } }`.

- Updated dependencies [29139eb]
- Updated dependencies [f493c66]
- Updated dependencies [a1a59b1]
- Updated dependencies [f493c66]
- Updated dependencies [a1a59b1]
- Updated dependencies [f493c66]
- Updated dependencies [cb1ab83]
- Updated dependencies [84a8799]
- Updated dependencies [1cbf2fc]
- Updated dependencies [1cbf2fc]
- Updated dependencies [f493c66]
- Updated dependencies [d2e3e68]
- Updated dependencies [bf55aac]
  - dynz@1.2.0
