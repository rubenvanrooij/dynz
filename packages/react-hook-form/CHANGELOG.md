# @dynz/react-hook-form-resolver

## 1.2.0

### Minor Changes

- 09fcfa9: Added `useDynzField(name)` and `<DynzField name render>` — the per-field wiring every consumer was otherwise hand-writing themselves (both of this repo's own example apps included): `useController` bound to the form's `control`, plus the schema's `included`/`required`/`mutable` state, the field's own schema, and automatic cross-field revalidation (`rules.deps`) for any field whose rules reference another.

  ```tsx
  <DynzField
    name="companyName"
    render={({ field, fieldState, required, readOnly }) => (
      <>
        <input {...field} aria-required={required} readOnly={readOnly} />
        {fieldState.error && <span>{fieldState.error.message}</span>}
      </>
    )}
  />
  ```

  `useDynzField` is the hook underneath, for consumers who want to build their own wrapper instead: `const { field, fieldState, formState, included, required, readOnly, schema } = useDynzField("companyName")`.

  Also: `react` moves from a `devDependency` to a `peerDependency` — `DynzField` is the first component this package ships that returns JSX at runtime.

### Patch Changes

- 94ea9ba: Fixed: `useOptions` built a malformed schema path (a stray trailing `}`, e.g. `` `$.someField}` ``), which broke resolving the underlying `OptionsSchema`. It also resolved each dynamic option's `enabled` predicate (and its dependencies) against the form root (`"$"`) instead of the options field's own path, so predicates referencing sibling fields relative to the options field could resolve incorrectly.
- 84a8799: Added `getOptions(name, schema, values)` and `getOptionsForSchema(schema, path, rootSchema, values)` to `dynz` — the framework-agnostic core of what each integration's `useOptions` hook/composable does: resolving an `options()` field's entries into `{ value, enabled }` pairs, where a dynamic entry's `enabled` predicate is resolved against `values`.

  ```ts
  getOptions("plan", schema, { hasSubscription: false });
  // [
  //   { value: "free", enabled: true },
  //   { value: "pro", enabled: false },
  // ]
  ```

  `@dynz/vue`'s `useOptions` now delegates to `getOptionsForSchema`, fixing a bug where a dynamic option's `enabled` predicate always resolved relative refs (`ref(...)`) against the schema root instead of the options field's own position — wrong for any options field nested inside an `object({...})`/`array(...)`, since a relative ref inside that predicate is meant to resolve against its siblings.

  `@dynz/react-hook-form`'s `useOptions`/`useOptionsSchema` (already correct) now delegate to the same shared helper instead of duplicating the resolution logic — no behavior change.

- Updated dependencies [f493c66]
- Updated dependencies [f493c66]
- Updated dependencies [f493c66]
- Updated dependencies [cb1ab83]
- Updated dependencies [84a8799]
- Updated dependencies [f493c66]
- Updated dependencies [d2e3e68]
  - dynz@1.2.0

## 1.1.0

### Minor Changes

- c8effd5: added support for discriminated union schema

### Patch Changes

- Updated dependencies [c8effd5]
  - dynz@1.1.0

## 1.0.0

### Patch Changes

- Updated dependencies [11ba2bb]
- Updated dependencies [fa23320]
  - dynz@1.0.0

## 0.0.22

### Patch Changes

- Updated dependencies [5ab0409]
- Updated dependencies [5ab0409]
  - dynz@0.0.19

## 0.0.21

### Patch Changes

- e2b2fd0: renamed rules builder names to remove ambuigity between rules/functions
- bba62cd: Conditional property hooks (useIsIncluded, useConditionalProperty, useIsMutable and useIsRequired) now also traverse ancestor paths to build dependency list and take an optional array of names
- Updated dependencies [c704855]
- Updated dependencies [e2b2fd0]
- Updated dependencies [5e37967]
- Updated dependencies [b1bc4bf]
- Updated dependencies [594b3c9]
  - dynz@0.0.18

## 0.0.20

### Patch Changes

- Updated dependencies [345cf20]
  - dynz@0.0.17

## 0.0.19

### Patch Changes

- 873ed04: removed the object API and replaced it with the new fluent api
- Updated dependencies [873ed04]
  - dynz@0.0.16

## 0.0.18

### Patch Changes

- dc4eb75: added function support to dynz
- Updated dependencies [dc4eb75]
  - dynz@0.0.15

## 0.0.17

### Patch Changes

- Updated dependencies [8cbba32]
  - dynz@0.0.14

## 0.0.16

### Patch Changes

- Updated dependencies [6bdc69e]
  - dynz@0.0.13

## 0.0.15

### Patch Changes

- Updated dependencies [03a0ce1]
  - dynz@0.0.12

## 0.0.14

### Patch Changes

- cfb915a: fixed build issues
- Updated dependencies [cfb915a]
  - dynz@0.0.11

## 0.0.13

### Patch Changes

- Updated dependencies [93e08c7]
  - dynz@0.0.10

## 0.0.12

### Patch Changes

- 0552506: improved performance upgrades related to react form hooks

## 0.0.11

### Patch Changes

- 1852e28: fixed formatting issue
- 54d0ceb: fixed transpiling issue

## 0.0.10

### Patch Changes

- 494ea14: added extra react helpers for managing dependencies + utility components/hooks for easier integration
- Updated dependencies [494ea14]
  - dynz@0.0.9

## 0.0.9

### Patch Changes

- Updated dependencies [6b5db9c]
  - dynz@0.0.8

## 0.0.8

### Patch Changes

- Updated dependencies [6332c4c]
  - dynz@0.0.7

## 0.0.7

### Patch Changes

- Updated dependencies [74fce85]
  - dynz@0.0.6

## 0.0.6

### Patch Changes

- Updated dependencies [d8b5c94]
- Updated dependencies [955bef4]
- Updated dependencies [17c9e07]
- Updated dependencies [982b034]
- Updated dependencies [d863166]
  - dynz@0.0.5

## 0.0.5

### Patch Changes

- Updated dependencies [0dec073]
- Updated dependencies [5aff140]
- Updated dependencies [fd7197c]
  - dynz@0.0.4

## 0.0.4

### Patch Changes

- Updated dependencies [7fbff7a]
  - dynz@0.0.3

## 0.0.3

### Patch Changes

- new version
- Updated dependencies
  - dynz@0.0.2
