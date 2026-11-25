---
"@dynz/react-hook-form": minor
---

A form's UI and validation now read the same resource lookups: pass the resolvers with the new `resolvers` prop. The form looks up every enabled instance as the values change, once per key, and validation uses those results (waiting for running ones) instead of looking everything up again.

- New `resolvers` prop: resolvers by resource name, the same ones `validate` takes. They may be written inline.
- Each lookup gets a `signal`, aborted once its key is no longer current: debounce by waiting first.
- `useResource(path)` is replaced by `useResources()`: every enabled instance by path, with its `key`, `status` (`pending`, `settled` or `failed`) and `retry()`. In the component that calls `useDynzForm`, read `form.resources`.
- `useDynzForm` returns `resources`, as React state, and `DynzFormProvider` provides them to the hooks.

**BREAKING — migrating:**

- Move `schemaOptions.resolvers` up one level, to `resolvers`. `schemaOptions` no longer accepts `resolvers`. Resolvers no longer need their own caching.
- Replace `useResource(path)` with `useResources()[path]` (or `form.resources[path]`).
- Two kinds of failure: return an expected one (registry down) as one of the resource's outcomes, so the schema handles it. A resolver that throws is unexpected: its lookup is `failed` until `retry()`, the error is logged with `console.error`, and validation has no state for it meanwhile (a `resourceRef` to it is `undefined`).
- The resource store (`createResourceStore`, `ResourceStore`) and the `ResourceEntry` type are no longer exported, and `useDynzFormContext().resources` is now the instances by path.
