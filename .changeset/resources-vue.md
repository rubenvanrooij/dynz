---
"@dynz/vue": minor
---

Add resource support: `useDynzForm` looks up the schema's resources through `schemaOptions.resolvers`, re-looks them up when their keys change and revalidates dependent fields. New `useResource` composable reads a resource's state, and `useOptions`, `usePredicate` and `useConditionalProperty` now react to resource changes.
