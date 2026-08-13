---
"@dynz/vue": minor
---

Add `@dynz/vue`, the Vue 3 integration for dynz.

Standalone first: `useDynzForm` gives you reactive values, validation and per-field state with no form-library dependency. Because Vue tracks reads automatically, the condition composables (`useIsRequired`, `useIsIncluded`, `useIsMutable`, `useOptions`, `usePredicate`) are plain `computed`s over dynz' resolvers — no dependency collection needed, and excluded ancestors are handled for free.

Also ships `useDynzField` plus the renderless `DynzField`, `IsIncluded` and `When` components, and `dynzTypedSchema` for teams already using VeeValidate.
