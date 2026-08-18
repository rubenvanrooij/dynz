# @dynz/to-json-schema

## 0.0.2

### Patch Changes

- f493c66: A field with a static `default` is no longer listed in the generated JSON Schema's `required` array. Previously a required-by-default field with a `.setDefault(...)` was both required _and_ defaulted in the generated schema — a contradiction most JSON Schema / OpenAPI tooling reads as "omit me and this is what you get" vs. "you must supply me", and one that no longer matches `dynz`'s corrected runtime behavior (a static default now satisfies `required`).
- Updated dependencies [f493c66]
- Updated dependencies [f493c66]
- Updated dependencies [f493c66]
- Updated dependencies [f493c66]
  - dynz@1.2.0
