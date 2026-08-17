---
"dynz": patch
---

Fixed: `ref()` (and expressions built on it) could resolve the wrong value when an `object()`/`array()`/`discriminatedUnion()` had its own `.setDefault(...)` and was itself entirely absent — it would fall back to a field's own default (or `undefined`) instead of the value the container's default actually supplies for that field.

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
