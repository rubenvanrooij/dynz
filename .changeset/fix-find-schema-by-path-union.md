---
"dynz": minor
"@dynz/react-hook-form": patch
"@dynz/vue": patch
---

Fix `findSchemaByPath` resolving the wrong member of a discriminated union

`findSchemaByPath` had no document to read, so at a discriminated union it returned the
first member that happened to declare the requested field. For an array of unions this
meant `$.items[0].amount` and `$.items[1].amount` resolved to the same schema no matter
which variant each element actually was — silently, with no error.

It now accepts the values the path is resolved against, and narrows the union to the
member the document selects:

```ts
findSchemaByPath("$.items[0].amount", schema, { values });
findSchemaByPath("$.items[0].amount", schema, SchemaType.STRING, values);
```

Values are a tie-breaker, not a filter: a path naming a field the selected member does
not declare still resolves by scanning the other members, because adapters keep the
outgoing variant's fields mounted for a render while a discriminator changes. A missing
or wrong-shaped value never throws — it just stops narrowing.

Calling without values is unchanged and still resolves to the first member declaring the
field, so nothing breaks; pass values wherever you have them.

Also adds `findPossibleSchemasByPath(path, schema)`, returning every schema a path could
resolve to — one per reachable union member. Dependency collection needs this rather than
narrowing: the set of fields to watch has to stay stable across a discriminator flip,
since noticing that flip is what the watch is for. `getConditionDependencies` and
`useConditionalProperty` now use it, fixing watches that previously missed a condition
declared solely on a non-first variant.

`useDynzField`, `useOptions`, `useDiscriminatedUnionKeyValues` and `getOptions` now
resolve against live values, so a field inside a union sees its own variant's schema.

Resolving against values also means the resolved schema is a function of the union's
discriminator, so the react-hook-form hooks now watch it. `useOptions` and
`useDiscriminatedUnionKeyValues` previously had no such watch and would render the
outgoing variant's options after a variant switch; `useDynzField` was already covered by
the `included`/`required`/`mutable` watches. The Vue composables track it automatically
through `computed`.
