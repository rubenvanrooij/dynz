# dynz to Zod Schema Conversion

This example demonstrates how to convert a dynz schema to equivalent Zod schemas, showing different approaches and their trade-offs.

## Original dynz Schema

The original schema from `/examples/example/src/index.ts`:

```typescript
const schema = object({
  fields: {
    accountType: string({
      rules: [oneOf(['personal', 'business'])]
    }),
    companyName: string({
      rules: [min(2)],
      required: eq('accountType', 'business')
    }),
    email: string({
      rules: [email(), conditional({
        when: eq('accountType', 'business'),
        then: regex('@company\.com$', "Business accounts must use company email")
      })]
    })
  }
})
```

## Zod Conversion Approaches

### 1. Using `superRefine` (Most Similar to dynz)

```typescript
const schema = z.object({
  accountType: z.enum(['personal', 'business']),
  companyName: z.string().min(2).optional(),
  email: z.string().email()
}).superRefine((data, ctx) => {
  if (data.accountType === 'business') {
    if (!data.companyName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Company name is required for business accounts",
        path: ['companyName']
      });
    }
    
    if (!/@company\.com$/.test(data.email)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Business accounts must use company email",
        path: ['email']
      });
    }
  }
});
```

**Pros:**
- Most similar to dynz's conditional logic
- Flexible cross-field validation
- Single schema definition

**Cons:**
- More verbose error handling
- Less type-safe than discriminated unions

### 2. Using Discriminated Union (Most Zod-Idiomatic)

```typescript
const schema = z.discriminatedUnion('accountType', [
  z.object({
    accountType: z.literal('personal'),
    companyName: z.string().min(2).optional(),
    email: z.string().email()
  }),
  z.object({
    accountType: z.literal('business'),
    companyName: z.string().min(2),
    email: z.string().email().regex(/@company\.com$/)
  })
]);
```

**Pros:**
- More type-safe
- Cleaner separation of concerns
- Better IntelliSense/autocomplete
- Zod-idiomatic approach

**Cons:**
- Schema duplication
- Less flexible for complex conditions

### 3. Using Transform + Pipe (Advanced)

```typescript
const schema = z.object({
  accountType: z.enum(['personal', 'business']),
  companyName: z.string().min(2).optional(),
  email: z.string().email()
}).transform((data) => data)
  .pipe(
    z.object({...})
      .refine(/* business companyName */)
      .refine(/* business email */)
  );
```

**Pros:**
- Allows data transformation
- Composable validation pipeline
- Good for preprocessing

**Cons:**
- More complex
- Harder to understand
- Potential performance overhead

## Feature Mapping

| dynz Feature | Zod Equivalent |
|--------------|----------------|
| `string()` | `z.string()` |
| `email()` | `z.string().email()` |
| `min(2)` | `z.string().min(2)` |
| `oneOf(['a', 'b'])` | `z.enum(['a', 'b'])` |
| `required: eq('field', 'val')` | `.superRefine()` or discriminated union |
| `conditional({ when, then })` | `.superRefine()` or `.refine()` |
| `object({ fields: {...} })` | `z.object({...})` |

## Running the Example

```bash
# Install dependencies
pnpm install

# Run the example
pnpm start

# Or run in watch mode
pnpm dev
```

## Key Takeaways

1. **For simple either/or schemas**: Use discriminated unions
2. **For complex cross-field validation**: Use superRefine (closest to dynz)
3. **For single-field conditions**: Use refine
4. **For data transformation**: Use transform + pipe

## When to Choose Each Approach

- **Discriminated Union**: When you have clear, separate schema variants
- **SuperRefine**: When you need complex cross-field validation like dynz
- **Multiple Refines**: When you have several independent conditional rules
- **Transform + Pipe**: When you need to preprocess or transform data

The discriminated union approach is generally recommended for most use cases as it provides better type safety and is more idiomatic to Zod, while superRefine is better for complex conditional logic similar to what dynz provides.