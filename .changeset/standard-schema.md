---
"dynz": minor
---

Built-in [Standard Schema](https://standardschema.dev) support. Every schema created with the fluent builders now carries a `~standard` property, so dynz schemas can be passed directly to tRPC, TanStack Form/Router, Hono and any other Standard Schema consumer:

```ts
const result = await object({ name: string().min(3) })["~standard"].validate({ name: "Ada" });
// { value: { name: "Ada" } } | { issues: [{ message, path: ["name"] }] }
```

Issue paths are arrays of keys (`$.tags.[1]` → `["tags", 1]`). For plain-object or deserialized schemas, or to pass `currentValues`, `customRules` or a `messageTransformer`, use the new `standardSchema(schema, options?)`. `~standard` is non-enumerable, so `serialize()` output is unchanged.

Also exported: the `StandardSchemaV1` types and a `toPathSegments(path)` helper.
