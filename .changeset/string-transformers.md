---
"dynz": minor
---

Added string transformer functions: `trim(value)`, `uppercase(value)`, `lowercase(value)`, `capitalize(value)`, and `replace(value, pattern, replacement, flags?)`. Like the existing transformers (`sum`, `age`, `size`, ...) they compute a value for use inside a rule or predicate, e.g. `eq(uppercase(ref('countryCode')), v('NL'))`. `replace`'s pattern is stored as a plain string (mirroring the existing `matches` predicate), not a `RegExp` instance, so schemas stay JSON-serializable.
