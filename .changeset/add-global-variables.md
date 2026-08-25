---
"dynz": minor
---

Added `global()` and `createGlobals()` — a way to reference a value that lives outside the schema's own data (the current date, the current user's id, a feature flag) from anywhere a `ref()` can be used, resolved from `validate()`'s new `globals` option instead of the submitted values.

```ts
const schema = object({
  submittedAt: date(),
}).setRequired(gte(global("now", GlobalType.DATE), ref("submittedAt")));

validate(schema, undefined, { submittedAt: new Date() }, { globals: { now: new Date() } });
```

`GlobalType` is the subset of `SchemaType` a global's value is allowed to have — `STRING`/`NUMBER`/`BOOLEAN`/`DATE`, the scalars that round-trip through `JSON.stringify`/`JSON.parse` unambiguously — as opposed to e.g. `object`/`array`/`file`, which either need a full schema to interpret or don't make sense as a single externally-supplied value.

A global's declared type is checked strictly: unlike `ref()`, its value is **not coerced**, so it must be supplied as the exact JS type (a numeric string doesn't satisfy a `NUMBER` global, and an explicit `undefined` doesn't satisfy any declared type). A key with no matching entry in `globals` throws — a missing global is a configuration error, not a legitimately absent value the way an unresolvable `ref()` is.

For a schema that uses the same globals in several places, `createGlobals(contract)` binds a fixed set of keys to their types once, so a typo in a key is caught at compile time and each call site no longer needs to repeat the type:

```ts
const { global, values } = createGlobals({ now: GlobalType.DATE, minAmount: GlobalType.NUMBER });

const schema = object({
  submittedAt: date().max(global("now")),
  amount: number().min(global("minAmount")),
});

validate(schema, undefined, input, { globals: values({ now: new Date(), minAmount: 50 }) });
```

`values()` returns its argument unchanged — it exists purely to type-check the globals map against the contract, so a wrong type or a missing key is a compile-time error instead of a runtime one. The contract itself is plain, JSON-serializable data, so it can travel alongside a `serialize()`d schema to tell a remote consumer exactly what to supply.

Globals never appear in `result.values` and contribute no field dependencies (`getConditionDependencies`) — they live entirely outside the schema's own value tree.
