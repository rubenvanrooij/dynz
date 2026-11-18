---
"@dynz/react-hook-form": minor
---

Add resource support: `useDynzForm` looks up the schema's resources through `schemaOptions.resolvers`, re-looks them up when their keys change and revalidates dependent fields. New `useResource` hook reads a resource's state, and `useOptions`, `usePredicate` and `useConditionalProperty` now react to resource changes.
