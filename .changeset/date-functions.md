---
"dynz": minor
"@dynz/to-json-schema": patch
---

Added calendar date functions and rules. All calendar math is done in UTC, so results are the same on the server and in the browser.

- Transformers: `dateAdd(date, amount, unit)`, `dateDiff(left, right, unit)`, `startOf(date, unit)`, `endOf(date, unit)`. `unit` is `"day" | "month" | "year"`.
- Predicates (for conditions): `sameCalendar(left, right, unit)`, `isBoundaryDay(date, edge, unit)` (`edge` is `"first" | "last"`, `unit` is `"month" | "year"`).
- Date rules: `date().sameCalendar(date, unit, code?)` and `date().boundaryDay(edge, unit, code?)`.
- A generic `satisfies(predicate, code?)` rule on all schemas, which fails when the predicate evaluates to `false`.

```ts
object({
  startDate: date().boundaryDay("first", "month"),
  endDate: date()
    .min(dateAdd(ref("startDate"), 3, "month"))
    .satisfies(lte(dateDiff(ref("endDate"), ref("startDate"), "month"), 12)),
  payDate: date().sameCalendar(ref("startDate"), "year", "SAME_YEAR"),
  proRataReason: string().setRequired(eq(isBoundaryDay(ref("startDate"), "first", "month"), false)),
});
```

Fixes:

- `eq`/`neq` and the `equals`/`notEquals` rules now compare dates by instant instead of by reference. This includes a static date that became an ISO string after `serialize()`.
- `gt`/`gte`/`lt`/`lte` accept `Date` operands.
- `getRulesDependencies` and `getRulesDependenciesMap` now read the rules of the field at the given path instead of the root schema's rules. Before this fix, field-level rules were missing from the dependency map, so the react-hook-form and vue integrations did not re-validate dependent fields.
- Rule dependencies now include references nested inside functions, e.g. `after(dateAdd(ref("startDate"), 1, "day"))`.
- `before` rule threw an error message mentioning `afterRule`.

`@dynz/to-json-schema` reports `satisfies`, `same_calendar` and `boundary_day` as having no JSON Schema equivalent.
