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
