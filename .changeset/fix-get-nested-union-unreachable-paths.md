---
"dynz": patch
"@dynz/vue": patch
---

Fix `isIncluded`, `isRequired`, `isMutable` and `ref()` throwing `Cannot get nested value on non array or non object` for a path that the active discriminated union member declares as a leaf while another member declares it deeper (e.g. `holder` as a string in one member and an object in another). Such a path is now treated as not reachable: not included, and a `ref()` to it resolves to `undefined`.

`getNested` now returns `null` for every path it can't reach, including a path the schema doesn't declare at all. As a result, a mistyped path no longer throws `No schema found for path …` from `isIncluded`/`isRequired`/`isMutable` or `ref()`; it resolves as not included / `undefined`.

`@dynz/vue`'s `dynzTypedSchema().describe()` now checks whether a path exists in the schema explicitly, so it keeps reporting unknown paths as `exists: false`.
