# AGENTS.md

Conventions for agents and humans working in this repo. For commands, package layout and
domain concepts see [CLAUDE.md](./CLAUDE.md); this file covers how code should be written.

## Preferred pattern: functional paradigms

Prefer expressions over statements. Derive new values with `reduce`, `map`, `filter` and
`flatMap` rather than seeding a mutable accumulator and pushing into it from a loop.

**Why it matters here beyond taste:** the schema walkers in `packages/dynz/src/utils/`
and `packages/dynz/src/validate/` all traverse the same path/schema structure. When they
share a shape, a reader who understands one understands the rest, and a bug fixed in one
is visibly missing from the others. Divergent shapes are what let four copies of the
discriminated-union member lookup drift apart.

### The canonical walk

Path traversal is a `reduce` over the path segments, seeded with the root:

```ts
return path
  .split(/[.[\]]/)
  .filter(Boolean)
  .splice(1)
  .reduce<Accumulator>((prev, cur) => {
    if (prev.schema.type === SchemaType.ARRAY) {
      /* ... */
    }

    if (prev.schema.type === SchemaType.OBJECT) {
      /* ... */
    }

    if (prev.schema.type === SchemaType.DISCRIMINATED_UNION) {
      /* ... */
    }

    throw new Error(`Cannot find schema at path ${path}`);
  }, seed);
```

`findSchemaByPath` and `findCandidateSchemasByPath` in
`packages/dynz/src/utils/find-schema-by-path.ts` are the reference implementations. They
differ only in their accumulator — one schema versus every candidate schema — and keep
the same segment chain, the same branch order (array, object, union, then throw) and the
same error messages. A new walker should read like a third sibling.

### Do this

```ts
// Derive the new list; the accumulator is never mutated.
const candidates = prev
  .flatMap((candidate) => candidateChildren(candidate, cur, path))
  .filter((candidate, index, all) => all.indexOf(candidate) === index);
```

### Not this

```ts
// Mutable accumulator, nested loops and a flag variable to carry state between them.
let frontier = [schema];
for (const segment of segments) {
  const next = [];
  let sawLeaf = false;
  for (const current of frontier) {
    if (!isContainer(current)) {
      sawLeaf = true;
      continue;
    }
    for (const child of candidateChildren(current, segment, path)) {
      if (!next.includes(child)) next.push(child);
    }
  }
  frontier = next;
}
```

### Rules of thumb

- **No `let` for an accumulator.** If a variable is reassigned to build up a result, it
  wants to be a `reduce` or a `flatMap`.
- **No flag variables carrying state across loop iterations.** Ask the input instead —
  `prev.every(isContainer)` rather than a `sawLeaf` set inside the loop.
- **Return a value from every branch**, rather than mutating a shared accumulator and
  falling through. `flatMap` with `return []` for "nothing here" beats a conditional push.
- **Keep helpers total.** A per-step helper like `candidateChildren` returns an empty list
  for "not found" and throws only for genuinely malformed input, so one dead branch can't
  sink a lookup another branch resolves.
- **Match existing branch order and error strings** when adding a walker. Error messages
  are asserted by tests and read by users; gratuitous rewording is a breaking change.

### When imperative is fine

This is a preference, not a prohibition. Reach for a loop when the alternative is worse:
early exit from a genuinely hot path, `async` sequencing that `reduce` would obscure, or
a fold whose accumulator type is so awkward it hurts readability. Prefer clear code over
a contorted one-liner — but reach for the functional form first.

## Testing

Every branch of a walker needs coverage, including the discriminated-union branch. The
union path of `findSchemaByPath` shipped resolving the wrong member because that branch
had no test at all — the traversal tests covered only objects and arrays.

Tests live next to the source as `*.test.ts`. Fixtures are plain object literals
(`{ type: SchemaType.STRING }`) when exercising the walkers directly, and the fluent
builders when exercising behaviour a user would hit.
