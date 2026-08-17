---
"dynz": minor
---

`object()` and `array()` now support `.setDefault(...)`, matching the other six schema kinds.

Composite defaults use prefault-style semantics, not a verbatim, all-or-nothing substitute: if the object/array itself is left empty, the default is substituted and then handed to completely ordinary validation. Any field the default doesn't mention still applies its own `.setDefault(...)` independently, exactly as it would for a genuinely-submitted partial object — `.setDefault({})` is a valid, common pattern for "materialize the object so its fields' own defaults can run." A default only ever affects a field once that field is genuinely absent from the input; a partially-submitted object never has the object-level default merged into it.

```ts
object({
  foo: string().optional().setDefault("foo"),
  bar: string().optional().setDefault("bar"),
}).setDefault({});
// validated with no input -> { foo: "foo", bar: "bar" }
```

Also: a `Date` nested inside a composite default — at any depth — now survives a schema having gone through `serialize()` and `JSON.parse()`, the same guarantee bare `date()` defaults already had. The repair work is memoized per schema (`WeakMap`, keyed by schema identity), so it's paid once per schema rather than once per substitution — notably, once for an array item schema shared across every item, not once per item.
