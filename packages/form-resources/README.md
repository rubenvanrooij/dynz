# @dynz/form-resources

A form's resource lookups, for building a [dynz](https://npmjs.com/package/dynz) form integration. [`@dynz/react-hook-form`](https://npmjs.com/package/@dynz/react-hook-form) and [`@dynz/vue`](https://npmjs.com/package/@dynz/vue) use it; an application using those does not need it directly.

`createResourceCache(schema, resolvers)` holds the lookups of one form. It takes the same resolvers as dynz' `validate`, looks up every enabled resource instance for the form's values once per resource name and key, and keeps the results for the form's lifetime. The form's conditions, its UI and its validation all read this one cache, so they always agree.

```typescript
import { createResourceCache } from "@dynz/form-resources";
import { validate } from "dynz";

const cache = createResourceCache(schema, {
  vehicle: async (plate, { signal }) =>
    (await fetch(`/api/vehicles/${plate}`, { signal })).json(),
});

// on every value change: evaluates the resources and starts the lookups they need
cache.update(values);

// re-render when the resources change
cache.subscribe(() => render(cache.current()));

// validation reads the cache, and waits for lookups that are still running
await validate(schema, undefined, values, { resolvers: cache.resolvers });
```

- `current()` gives every enabled instance by path (`$.vehicle`, `$.drivers.[0].vehicle`), each `pending`, `settled` (with its `state`) or `failed` (with its `error`), with `retry()`, and the settled `states` for resolving `resourceRef`s. It returns the same object while nothing changed.
- A running lookup is aborted (its `signal`) once its key is no longer current: a resolver can debounce by waiting first.
- A resolver that throws leaves its instance `failed` and logs the error with `console.error`. Validation gets no state for it (a `resourceRef` to it is `undefined`) until it is retried. Return a fallback outcome instead, so the schema decides what a failure means.
- `dispose()` aborts the running lookups and forgets every result.

`changedResourcePaths` and `fieldPathsReadingResources` tell which fields read the resources that changed, to validate them again.
