import { z } from "zod";

console.log("=== dynz to Zod Schema Conversion ===\n");

// ===== ORIGINAL DYNZ SCHEMA (for reference) =====
/*
const dynzSchema = object({
  fields: {
    accountType: string({
      rules: [oneOf(['personal', 'business'])]
    }),
  
    // Only required if accountType is 'business'
    companyName: string({
      rules: [min(2)],
      required: eq('accountType', 'business')
    }),
    
    email: string({
      rules: [email(), conditional({
        // Different validation rules based on account type
        when: eq('accountType', 'business'),
        then: regex('@company\.com$', "Business accounts must use company email")
      })]
    })
  }
});
*/

// ===== APPROACH 1: Using superRefine (most similar to dynz conditional logic) =====

const zodSchemaWithSuperRefine = z
  .object({
    accountType: z.enum(["personal", "business"], {
      errorMap: () => ({
        message: "Account type must be personal or business",
      }),
    }),
    companyName: z
      .string()
      .min(2, "Company name must be at least 2 characters")
      .optional(),
    email: z.string().email("Must be a valid email address"),
  })
  .superRefine((data, ctx) => {
    // Conditional required: companyName required if accountType is 'business'
    if (data.accountType === "business") {
      if (!data.companyName || data.companyName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Company name is required for business accounts",
          path: ["companyName"],
        });
      }

      // Conditional regex: business emails must end with @company.com
      if (data.email && !/@company\.com$/.test(data.email)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Business accounts must use company email",
          path: ["email"],
        });
      }
    }
  });

// ===== APPROACH 2: Using discriminated union (more Zod-idiomatic) =====

const zodSchemaWithDiscriminatedUnion = z.discriminatedUnion("accountType", [
  // Personal account schema
  z.object({
    accountType: z.literal("personal"),
    email: z.string().email(),
  }),

  // Business account schema
  z.object({
    accountType: z.literal("business"),
    companyName: z
      .string()
      .min(2, "Company name is required for business accounts"),
    email: z
      .string()
      .email("Must be a valid email address")
      .regex(/@company\.com$/, "Business accounts must use company email"),
  }),
]);

// ===== APPROACH 3: Using transform + pipe (advanced pattern) =====

const zodSchemaWithTransform = z
  .object({
    accountType: z.enum(["personal", "business"]),
    companyName: z.string().min(2).optional(),
    email: z.string().email(),
  })
  .transform((data) => {
    // Pre-validation transforms could go here
    return data;
  })
  .pipe(
    z
      .object({
        accountType: z.enum(["personal", "business"]),
        companyName: z.string().min(2).optional(),
        email: z.string().email(),
      })
      .refine(
        (data) => {
          // Business accounts must have company name
          if (data.accountType === "business" && !data.companyName) {
            return false;
          }
          return true;
        },
        {
          message: "Company name is required for business accounts",
          path: ["companyName"],
        },
      )
      .refine(
        (data) => {
          // Business accounts must use company email
          if (
            data.accountType === "business" &&
            !/@company\.com$/.test(data.email)
          ) {
            return false;
          }
          return true;
        },
        {
          message: "Business accounts must use company email",
          path: ["email"],
        },
      ),
  );

// ===== TYPE INFERENCE =====

type UserFormData = z.infer<typeof zodSchemaWithSuperRefine>;
type UserFormDataUnion = z.infer<typeof zodSchemaWithDiscriminatedUnion>;

// ===== TEST DATA =====

const validPersonalData = {
  accountType: "personal" as const,
  email: "john@gmail.com",
};

const validBusinessData = {
  accountType: "business" as const,
  companyName: "Acme Corp",
  email: "john@company.com",
};

const invalidBusinessData = {
  accountType: "business" as const,
  // Missing companyName
  email: "john@gmail.com", // Wrong email domain
};

// ===== TESTING VALIDATION =====

console.log("--- Testing Approach 1: superRefine ---");

console.log("✅ Valid personal data:");
const result1 = zodSchemaWithSuperRefine.safeParse(validPersonalData);
console.log(result1.success ? "SUCCESS" : "FAILED");
if (result1.success) {
  console.log("Data:", result1.data);
} else {
  console.log("Errors:", result1.error.errors);
}

console.log("\n✅ Valid business data:");
const result2 = zodSchemaWithSuperRefine.safeParse(validBusinessData);
console.log(result2.success ? "SUCCESS" : "FAILED");
if (result2.success) {
  console.log("Data:", result2.data);
} else {
  console.log("Errors:", result2.error.errors);
}

console.log("\n❌ Invalid business data:");
const result3 = zodSchemaWithSuperRefine.safeParse(invalidBusinessData);
console.log(result3.success ? "SUCCESS" : "FAILED");
if (!result3.success) {
  console.log(
    "Errors:",
    result3.error.errors.map((e) => ({
      path: e.path.join("."),
      message: e.message,
    })),
  );
}

console.log("\n--- Testing Approach 2: discriminatedUnion ---");

console.log("✅ Valid personal data:");
const result4 = zodSchemaWithDiscriminatedUnion.safeParse(validPersonalData);
console.log(result4.success ? "SUCCESS" : "FAILED");

console.log("\n✅ Valid business data:");
const result5 = zodSchemaWithDiscriminatedUnion.safeParse(validBusinessData);
console.log(result5.success ? "SUCCESS" : "FAILED");

console.log("\n❌ Invalid business data:");
const result6 = zodSchemaWithDiscriminatedUnion.safeParse(invalidBusinessData);
console.log(result6.success ? "SUCCESS" : "FAILED");
if (!result6.success) {
  console.log(
    "Errors:",
    result6.error.errors.map((e) => ({
      path: e.path.join("."),
      message: e.message,
    })),
  );
}

// ===== COMPARISON TABLE =====

console.log("\n=== dynz vs Zod Feature Comparison ===\n");

const comparisonTable = `
┌─────────────────────────────────┬─────────────────────────────┬───────────────────────────────────┐
│ Feature                         │ dynz                        │ Zod                               │
├─────────────────────────────────┼─────────────────────────────┼───────────────────────────────────┤
│ String validation               │ string()                    │ z.string()                        │
│ Email validation                │ email()                     │ z.string().email()                │
│ Min length                      │ min(2)                      │ z.string().min(2)                 │
│ Enum/OneOf                      │ oneOf(['a', 'b'])           │ z.enum(['a', 'b'])                │
│ Conditional required            │ required: eq('field', 'val') │ .superRefine() or discriminated   │
│ Conditional rules               │ conditional({ when, then }) │ .superRefine() or .refine()       │
│ Cross-field validation          │ Built-in with conditions    │ .superRefine() with ctx.addIssue  │
│ Type inference                  │ SchemaValues<T>             │ z.infer<T>                        │
│ Error customization             │ Custom code parameter       │ errorMap or custom messages       │
│ Schema composition              │ object({ fields: {...} })   │ z.object({...})                   │
└─────────────────────────────────┴─────────────────────────────┴───────────────────────────────────┘
`;

console.log(comparisonTable);

console.log("\n=== Key Differences ===");
console.log(`
1. **Conditional Logic**:
   - dynz: Built-in conditional system with eq(), and(), or() conditions
   - Zod: Uses superRefine(), refine(), or discriminated unions
   
2. **Schema Structure**:
   - dynz: object({ fields: {...} }) wrapper
   - Zod: Direct z.object({...}) definition
   
3. **Type Safety**:
   - Both provide excellent TypeScript integration
   - dynz has SchemaValues<T>, Zod has z.infer<T>
   
4. **Cross-field Validation**:
   - dynz: First-class support with conditions
   - Zod: Requires superRefine with manual path specification
   
5. **Error Handling**:
   - dynz: Custom codes on rules
   - Zod: ErrorMap system or per-method messages
`);

console.log("\n=== Recommendations ===");
console.log(`
- Use **discriminated union** for simple either/or schemas
- Use **superRefine** for complex cross-field validation (closest to dynz)
- Use **refine** for single-field conditional validation
- Consider **transform + pipe** for advanced preprocessing needs
`);

export {
  zodSchemaWithSuperRefine,
  zodSchemaWithDiscriminatedUnion,
  zodSchemaWithTransform,
  type UserFormData,
  type UserFormDataUnion,
};
