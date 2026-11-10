# `@dynz/react-hook-form-resolver`

A TypeScript-first React Hook Form resolver for [dynz](https://npmjs.com/package/dynz) schema validation. Provides seamless integration between dynz's and React Hook Form's form handling.

## Dynz Features

- 🎯 **Type-safe**: Full TypeScript support with static type inference
- 🔄 **Cross-field validation**: Reference other form fields in validation rules
- 📐 **Conditional validation**: Apply rules based on field values and conditions

## Installation

```bash
npm install @dynz/react-hook-form-resolver dynz react-hook-form
```

## Quick Start

```tsx
import { useForm } from "react-hook-form";
import { dynzResolver } from "@dynz/react-hook-form-resolver";
import { object, string, number, min, max, ref, eq } from "dynz";

// Define your schema
const schema = object({
  fields: {
    email: string({ rules: [email()] }),
    password: string({ rules: [min(8)] }),
    confirmPassword: string({
      rules: [equals(ref("password"), "Passwords must match")],
    }),
    age: number({ rules: [min(18), max(120)] }),
  },
});

function RegistrationForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: dynzResolver(schema),
    mode: "onChange",
  });

  const onSubmit = (data) => {
    console.log("Valid form data:", data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} placeholder="Email" />
      {errors.email && <span>{errors.email.message}</span>}

      <input {...register("password")} type="password" placeholder="Password" />
      {errors.password && <span>{errors.password.message}</span>}

      <input
        {...register("confirmPassword")}
        type="password"
        placeholder="Confirm Password"
      />
      {errors.confirmPassword && <span>{errors.confirmPassword.message}</span>}

      <input {...register("age")} type="number" placeholder="Age" />
      {errors.age && <span>{errors.age.message}</span>}

      <button type="submit">Register</button>
    </form>
  );
}
```

## API Reference

### `dynzResolver(schema, currentValues?, schemaOptions?, resolverOptions?)`

Creates a React Hook Form resolver from a dynz schema.

#### Parameters

- **`schema`** (`Schema`): The dynz schema to validate against
- **`currentValues?`** (`SchemaValues<TSchema>`): Current form values for cross-field validation
- **`schemaOptions?`** (`ValidateOptions`): Dynz validation options
- **`resolverOptions?`** (`ResolverOptions`): Resolver-specific configuration

#### `ResolverOptions`

```typescript
type ResolverOptions = {
  messageTransformer?: (errorMessage: ErrorMessage) => string;
  mode?: "async" | "sync";
  raw?: boolean;
};
```

- **`messageTransformer`**: Custom function to transform error messages
- **`mode`**: Validation mode (defaults to 'async')
- **`raw`**: Return raw form values instead of processed schema values

## Field Wiring: `useDynzForm`, `useDynzField`, `DynzField`

Beyond the resolver, this package ships the per-field wiring every consumer otherwise hand-writes: reading the schema's `included`/`required`/`mutable` state for a field and binding it to react-hook-form's `Controller`/`useController`.

```tsx
import {
  useDynzForm,
  DynzFormProvider,
  DynzField,
} from "@dynz/react-hook-form";
import { object, string, number } from "dynz";

const schema = object({
  email: string().email(),
  age: number().min(18).optional(),
});

function RegistrationForm() {
  const form = useDynzForm({ schema });

  return (
    <DynzFormProvider {...form}>
      <form onSubmit={form.handleSubmit(console.log)}>
        <DynzField
          name="email"
          render={({ field, fieldState, required }) => (
            <>
              <input {...field} aria-required={required} />
              {fieldState.error && <span>{fieldState.error.message}</span>}
            </>
          )}
        />
        <DynzField
          name="age"
          render={({ field, readOnly }) => (
            <input {...field} type="number" readOnly={readOnly} />
          )}
        />
        <button type="submit">Submit</button>
      </form>
    </DynzFormProvider>
  );
}
```

- **`useDynzForm({ schema, ... })`** — `useForm` plus the dynz resolver and the schema/dependency context `useDynzFormContext` reads back out. Everything `useForm` normally accepts (`defaultValues`, `mode`, ...) is accepted too.
- **`<DynzFormProvider {...form}>`** — a thin wrapper around react-hook-form's own `FormProvider`.
- **`useDynzField(name)`** — binds one field: `useController` bound to the form's `control`, plus `included`/`required`/`readOnly` resolved from the schema, the field's own schema (e.g. for `.setUi(...)`/`.setMeta(...)` rendering hints), and automatic cross-field revalidation for any field this one's rules reference. Returns `{ field, fieldState, formState, included, required, readOnly, schema }`.
- **`<DynzField name render>`** — a render-prop wrapper around `useDynzField`: renders nothing when the field isn't currently included, and calls `render(...)` with the same shape otherwise.
- **`<IsIncluded name>children</IsIncluded>`** and **`<When cond={predicate}>children</When>`** — lighter-weight components for conditionally rendering non-field content based on the schema.

## Resources

If your schema declares resources (see the [dynz README](https://npmjs.com/package/dynz)), pass a resolver per resource in `schemaOptions.resolvers`. Read a lookup's state with `useResource(path)`:

```tsx
// define it outside the component (or memoize it): a new object re-subscribes the form
const SCHEMA_OPTIONS = {
  resolvers: {
    vehicle: cached((plate) => api.lookupVehicle(plate)),
  },
};

function VehicleForm() {
  const form = useDynzForm({ schema, schemaOptions: SCHEMA_OPTIONS });
  // { status: "pending" | "settled" | "failed", key, state? }, or undefined when not enabled
  const vehicle = useResource("$.vehicle");
  // ...
}
```

### Cache your resolvers

**Resolvers are called a lot.** The form looks up a resource whenever its key changes. On top of that, every validation calls all enabled resolvers again: that is every change in `mode: "onChange"`, every blur, and every submit. A resolver that sends a request each time sends one request per keystroke, for every resource.

So every resolver you pass to a form should:

1. **Cache by key**, so a repeated call with the same key returns the earlier result.
2. **Share requests that are still in flight.** The form's lookup and a validation often call the resolver at the same moment, before the first request has returned. Cache the _promise_, not only the result.
3. **Never throw.** Return a fallback outcome instead, e.g. `"unavailable"`. A resolver that throws makes validation reject, and `handleSubmit` then throws instead of showing field errors.

A minimal version without dependencies:

```ts
import type { ResourceResolver, ResourceState } from "dynz";

function cached(
  lookup: (key: string) => Promise<ResourceState>,
): ResourceResolver {
  const cache = new Map<string, Promise<ResourceState>>();

  return (key) => {
    const id = String(key);

    if (!cache.has(id)) {
      cache.set(
        id,
        lookup(id).catch(() => {
          cache.delete(id); // try again on the next call
          return { outcome: "unavailable" };
        }),
      );
    }

    return cache.get(id)!;
  };
}
```

With TanStack Query, `fetchQuery` already shares in-flight requests and caches by key. Do set a `staleTime`: with the default of `0`, every call fetches again.

```ts
const vehicle: ResourceResolver = (plate) =>
  queryClient
    .fetchQuery({
      queryKey: ["vehicle", String(plate)],
      queryFn: () => api.lookupVehicle(String(plate)),
      staleTime: 5 * 60_000,
    })
    .catch(() => ({ outcome: "unavailable" }));
```

The fallback outcome has to be one of the resource's declared `outcomes`. Handle it in your resource conditions like any other outcome.

## Advanced Examples

### Conditional Validation

```tsx
import { object, string, number, conditional, eq, min } from "dynz";

const userSchema = object({
  fields: {
    userType: string({ rules: [oneOf(["student", "teacher", "admin"])] }),
    age: number({ rules: [min(13)] }),
    studentId: string({
      included: eq("userType", "student"),
      rules: [
        conditional({
          when: eq("userType", "student"),
          then: min(1, "Student ID is required"),
        }),
      ],
    }),
    yearsExperience: number({
      included: eq("userType", "teacher"),
      rules: [
        conditional({
          when: eq("userType", "teacher"),
          then: min(0, "Years of experience must be 0 or more"),
        }),
      ],
    }),
  },
});

function UserForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: dynzResolver(userSchema),
  });

  const userType = watch("userType");

  return (
    <form onSubmit={handleSubmit(console.log)}>
      <select {...register("userType")}>
        <option value="">Select type</option>
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
        <option value="admin">Admin</option>
      </select>

      <input {...register("age")} type="number" placeholder="Age" />

      {userType === "student" && (
        <input {...register("studentId")} placeholder="Student ID" />
      )}

      {userType === "teacher" && (
        <input
          {...register("yearsExperience")}
          type="number"
          placeholder="Years Experience"
        />
      )}

      <button type="submit">Submit</button>
    </form>
  );
}
```

### Custom Error Messages

```tsx
import { dynzResolver } from "@dynz/react-hook-form-resolver";

const resolver = dynzResolver(
  schema,
  undefined, // currentValues
  undefined, // schemaOptions
  {
    messageTransformer: (error) => {
      switch (error.code) {
        case "required":
          return `${error.path} is required`;
        case "min":
          return `Must be at least ${error.min} characters`;
        case "email":
          return "Please enter a valid email address";
        default:
          return error.message;
      }
    },
  },
);
```

### Working with Current Values

```tsx
function EditProfileForm({ initialData }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: dynzResolver(profileSchema, initialData),
    defaultValues: initialData,
  });

  // The resolver will use initialData as currentValues for validation
  // This enables proper mutable field validation and change detection
}
```

### Private Field Handling

```tsx
import { object, string, plain, mask } from "dynz";

const schema = object({
  fields: {
    username: string(),
    password: string({ private: true }),
    ssn: string({
      private: true,
      default: mask(plain(), (value) => `***-**-${value?.slice(-4)}`),
    }),
  },
});

// Private fields are automatically masked in the resolved values
// but validation still works on the original input
```

## Error Handling

The resolver automatically transforms dynz validation errors into React Hook Form's error format:

```typescript
// Dynz error format
{
  path: "$.email",
  code: "email",
  message: "Invalid email format"
}

// Becomes React Hook Form error
{
  email: {
    type: "email",
    message: "Invalid email format"
  }
}
```

## Integration with Existing Forms

The resolver works seamlessly with all React Hook Form features:

- ✅ Field arrays (`useFieldArray`)
- ✅ Conditional fields
- ✅ Custom validation modes
- ✅ Form state management
- ✅ Async validation
- ✅ Native browser validation

## TypeScript Support

Full type safety is maintained throughout the validation process:

```tsx
type FormData = SchemaValues<typeof schema>;
// FormData is automatically inferred from your schema

const { handleSubmit } = useForm<FormData>({
  resolver: dynzResolver(schema),
});

const onSubmit = (data: FormData) => {
  // data is fully typed based on your schema
};
```

## License

MIT
