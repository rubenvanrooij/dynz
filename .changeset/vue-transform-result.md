---
"@dynz/vue": minor
---

Add a `transformResult` option to `useDynzForm` and `dynzTypedSchema` that lets you alter the dynz validation result before it is mapped to VeeValidate field errors, e.g. to filter out errors for certain paths. It receives the raw dynz result (with absolute `$.`-paths) and the validated values, may be async, and runs before `messageTransformer`.
