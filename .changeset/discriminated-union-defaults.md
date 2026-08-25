---
"dynz": minor
---

`discriminatedUnion()` now supports `.setDefault(...)`, matching `object()`/`array()`. Same prefault-style semantics: the default only fires when the union itself is entirely absent, and the discriminator key is required in the default value — it's what picks which member applies. Every other field of that member falls back to its own `.setDefault(...)` independently, exactly like a partial object default.

```ts
discriminatedUnion("type", [
  { type: "email", email: string().setDefault("hello@example.com") },
  { type: "phone", phone: string() },
]).setDefault({ type: "email" });
// validated with no input -> { type: "email", email: "hello@example.com" }
```

Also fixes an unrelated, pre-existing bug found while implementing this: `ref()` into a discriminated union's member field (e.g. `ref("contact.email")`) returned the whole union object instead of the field's own value.
