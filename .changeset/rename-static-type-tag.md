---
"dynz": minor
---

**Breaking:** the internal `type` discriminant tag on `v()`'s `Static` values changed from `"st"` to `"_dstatic"` (now exported as `STATIC_TYPE`), for consistency with `Reference`'s `_dref` and the new `GlobalReference`'s `_dglobal` — `"st"` was a plain, collision-prone word, unlike the namespaced tags every other internal wrapper type uses.

This is a wire-format break, not just a code one: since schemas are plain JSON-serializable data, any schema previously persisted or cached via `serialize()`/`JSON.stringify()` has its `v()`-wrapped values tagged `{"type":"st",...}`. After upgrading, those are no longer recognized — re-serialize any stored/cached schemas after upgrading to this version.
