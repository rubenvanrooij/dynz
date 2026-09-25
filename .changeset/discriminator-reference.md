---
"dynz": minor
"@dynz/react-hook-form": minor
"@dynz/vue": minor
---

Fixed: a `ref()` to a discriminated union's discriminator (e.g. `ref("$.options.0.type")`)
always resolved to `undefined`, so every predicate built on it was `false`. The
discriminator had no schema of its own, so path lookups returned the union and the value
failed its type check.

`getNested`, `findSchemaByPath` and `findPossibleSchemasByPath` now resolve a
discriminator path to an options schema listing every member's discriminator value. The
same object is returned for every lookup of the same union.

As a result `useOptions` works on a discriminator path and returns the variant choices,
following ancestor unions as they switch. `useDiscriminatedUnionKeyValues` is removed from
`@dynz/react-hook-form` and `@dynz/vue`: call `useOptions("<union>.<key>")` instead.
