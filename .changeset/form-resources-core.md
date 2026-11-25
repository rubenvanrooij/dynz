---
"dynz": minor
---

Resolvers receive a `signal`, for the form integrations' lookups.

- A resolver now receives a `signal` in its second argument (`{ ...resource, signal }`). `validate` passes one that never aborts, so server-side resolvers work as before.

**BREAKING:** removed the helpers of the previous form lookups: `ResourceEntry`, `ResourceEntries`, `reconcileResourceEntries`, `lookupResource`, `settleResourceEntry` and `settledStates`. `changedResourcePaths` and `fieldPathsReadingResources` are now internal to the form integrations.
