---
"@dynz/vue": minor
---

A form's UI and validation now read the same resource lookups: pass the resolvers with the new `resolvers` option. The form looks up every enabled instance as the values change, once per key, and validation uses those results (waiting for running ones) instead of looking everything up again.

- New `resolvers` option: resolvers by resource name, the same ones `validate` takes.
- Each lookup gets a `signal`, aborted once its key is no longer current: debounce by waiting first.
- `useResource(path)` is replaced by `useResources(context?)`: every enabled instance by path, with its `key`, `status` (`pending`, `settled` or `failed`) and `retry()`.

**BREAKING — migrating:**

- Move `schemaOptions.resolvers` up one level, to `resolvers`. `schemaOptions` no longer accepts `resolvers`. Resolvers no longer need their own caching.
- Replace `useResource(path)` with `useResources()` and read the instance by path.
- A resolver that throws leaves its lookup `failed` until `retry()`, and logs the error with `console.error`. Validation gets no state for it meanwhile (a `resourceRef` to it is `undefined`): return a fallback outcome from the resolver instead, so the schema decides what a failure means.
- The context's `getResourceEntries` is replaced by `getResourceInstances`.
