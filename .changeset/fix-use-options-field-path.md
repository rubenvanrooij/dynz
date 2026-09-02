---
"@dynz/react-hook-form": patch
---

Fixed: `useOptions` built a malformed schema path (a stray trailing `}`, e.g. `` `$.someField}` ``), which broke resolving the underlying `OptionsSchema`. It also resolved each dynamic option's `enabled` predicate (and its dependencies) against the form root (`"$"`) instead of the options field's own path, so predicates referencing sibling fields relative to the options field could resolve incorrectly.
