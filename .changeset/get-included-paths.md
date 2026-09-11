---
"dynz": minor
---

Added `getIncludedPaths(schema, values)`, which walks a schema against a concrete `values` document and returns every path that's currently included — object/array/discriminated-union containers as well as their descendants — each annotated with its schema `type` and resolved `required`/`mutable` state.

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