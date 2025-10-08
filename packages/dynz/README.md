# dynz

[![License: MIT][license-image]][license-url]
[![CI][ci-image]][ci-url]
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]

A powerful TypeScript schema validation library with advanced conditional logic, cross-field validation, and privacy controls.

## Features

🔒 **Type-Safe Validation** - Full TypeScript support with strong typing and inference  
🔄 **Conditional Logic** - Dynamic validation rules based on field values  
🎯 **Cross-Field Validation** - Reference other fields in validation rules  
🔐 **Privacy Controls** - Built-in field masking for sensitive data  
⚡ **Performance Optimized** - Efficient validation with minimal overhead  
🧩 **Framework Agnostic** - Works with any JS frameworks

## Installation

```bash
npm install dynz
# or
pnpm add dynz
# or
yarn add dynz
```

## Quick Start

```typescript
import { object, string, number, validate, eq, min, email } from "dynz";

// Define a schema
const userSchema = object({
  fields: {
    name: string({ rules: [min(2)] }),
    email: string({ rules: [email()] }),
    age: number({ rules: [min(18)] }),
  },
});

// Validate data
const result = validate(userSchema, undefined, {
  name: "John Doe",
  email: "john@example.com",
  age: 25,
});

if (result.success) {
  console.log("Valid data:", result.values);
} else {
  console.log("Validation errors:", result.errors);
}
```

## Core Concepts

### Schema Types

dynz supports comprehensive schema types for all common data structures:

```typescript
import { string, number, boolean, object, array, max, min, regex } from "dynz";

// String schema with validation rules
const nameSchema = string({
  rules: [min(2), max(50), regex("^[a-zA-Z\\s]+$")],
});

// Number schema with constraints
const ageSchema = number({
  rules: [min(0), max(120)],
});

// Object schema with nested fields
const userSchema = object({
  fields: {
    profile: object({
      fields: {
        name: string({ rules: [min(1)] }),
        bio: string({ required: false }),
      },
    }),
  },
});

// Array schema
const tagsSchema = array({
  schema: string({ rules: [min(1)] }),
  rules: [min(1), max(5)],
});
```

### Validation Rules

Extensive validation rules for precise data validation:

```typescript
import {
  object,
  string,
  min,
  max,
  email,
  number,
  regex,
  isNumeric,
  options,
} from "dynz";

const productSchema = object({
  fields: {
    name: string({ rules: [min(1), max(100)] }),
    email: string({ rules: [email()] }),
    price: number({ rules: [min(0)] }),
    category: options({ options: ["electronics", "books", "clothing"] }),
    sku: string({ rules: [regex("^[A-Z]{3}-\\d{4}$")] }),
    quantity: string({ rules: [isNumeric()] }),
  },
});
```

### Conditional Logic

`dynz` excels at dynamic validation based on other field values:

```typescript
import {
  eq,
  and,
  or,
  conditional,
  email,
  min,
  object,
  oneOf,
  regex,
  string,
  options,
} from "dynz";

const userSchema = object({
  fields: {
    accountType: options({
      options: ["personal", "business"],
    }),

    // Required only for business accounts
    companyName: string({
      rules: [min(2)],
      required: eq("accountType", "business"),
    }),

    // Different validation rules based on account type
    email: string({
      rules: [
        email(),
        conditional({
          when: eq("accountType", "business"),
          then: regex(
            "@company\\.com$",
            "Business accounts must use company email",
          ),
        }),
      ],
    }),

    // Complex conditional logic
    specialField: string({
      required: and(
        eq("accountType", "business"),
        or(eq("industry", "finance"), eq("industry", "healthcare")),
      ),
    }),
  },
});
```

### Cross-Field References

Reference other fields in validation rules:

```typescript
import {
  after,
  dateString,
  equals,
  max,
  min,
  object,
  ref,
  string,
  validate,
} from "dynz";

const signupSchema = object({
  fields: {
    password: string({ rules: [min(8)] }),
    confirmPassword: string({
      rules: [equals(ref("password"), "Passwords must match")],
    }),
    birthYear: dateString({
      format: "yyyy",
      rules: [min("1900"), max("2024")],
    }),
    graduatedAt: dateString({
      format: "yyyy",
      rules: [
        after(ref("birthYear"), "Graduation date must be after birth year"),
      ],
    }),
  },
});
```

### Mutability Controls

Control when fields can be modified based on conditions:

```typescript
function buildSchema(user: { role: "admin" | "user" }) {
  return object({
    fields: {
      status: options({
        options: ["draft", "published"],
      }),

      title: string({
        rules: [min(1)],
        mutable: user.role === "admin",
      }),

      content: string({
        mutable: eq("status", "draft"),
      }),

      createdAt: string({
        mutable: false, // Never mutable
      }),
    },
  });
}
```

#### Mutability on array schemas

You can also control mutability on inner schemas of an array. This allows you to add new elements or remove elements, but not to mutate elements on the same index.

```typescript
const schema = array({
  // The array is mutable
  schema: string({
    mutable: false, // The inner schema is immutable
  }),
});

validate(schema, [], ["foo"]); // Validates successfully, because it's a new entry

validate(schema, ["foo"], []); // Validates successfully, because an entry is removed

validate(schema, ["foo"], ["bar"]); // Returns an error since 'foo' is mutated into 'bar'
```

### Field Inclusion

Dynamically include or exclude fields:

```typescript
const registrationSchema = object({
  fields: {
    dietryRestrictions: boolean(),

    dietryDetail: string({
      included: eq("dietryRestrictions", true),
    }),
  },
});
```

## Advanced Usage

### Custom Rules

Create reusable custom validation logic:

```typescript
const passwordStrengthRule = custom('passwordStrength', {
  minScore: 4,
  requireSpecialChars: true
})

const passwordStrengthRuleValidator: CustomRuleFunction = (value, params) => {
  ...
}

const strongPasswordSchema = string({
  rules: [min(8), passwordStrengthRule]
})

validate(strongPasswordSchema, undefined, 'myStrongPassword', {
  customRules: {
    passwordStrength: passwordStrengthRuleValidator
  }
})

```

### Complex Conditional Schemas

```typescript
const orderSchema = object({
  fields: {
    orderType: options({ options: ["standard", "express", "international"] }),

    shippingMethod: options({
      options: ["overnight", "same-day", "air", "sea"],
      rules: [
        conditional({
          when: eq("orderType", "express"),
          then: oneOf(["overnight", "same-day"]),
        }),
        conditional({
          when: eq("orderType", "international"),
          then: oneOf(["air", "sea"]),
        }),
      ],
      required: or(
        eq("orderType", "express"),
        eq("orderType", "international"),
      ),
    }),
    customsInfo: object({
      fields: {
        value: number({ rules: [min(0)] }),
        description: string({ rules: [min(1)] }),
      },
      included: eq("orderType", "international"),
    }),
  },
});
```

### Mutable Conditions in Practice

```typescript
// Order management with status-based mutability
const orderSchema = object({
  fields: {
    orderStatus: options({
      options: ["draft", "pending", "send"],
      // always immutable
      mutable: false,
    }),

    items: array({
      schema: string(),
      mutable: or(eq("orderStatus", "draft"), eq("orderStatus", "pending")),
    }),

    shippingAddress: string({
      mutable: and(
        or(eq("orderStatus", "draft"), eq("orderStatus", "pending")),
      ),
    }),
  },
});
```

## API Reference

### Schema Builders

- `string(options?)` - String validation schema
- `number(options?)` - Number validation schema
- `boolean(options?)` - Boolean validation schema
- `object({ fields })` - Object schema with nested fields
- `array({ schema })` - Array schema with item validation
- `dateString(options?)` - Date string validation with format support
- `options({ options })` - Enum-like validation for predefined values
- `file(options?)` - File validation schema

### Validation Rules

- `min(value, message?)` - Minimum value/length
- `max(value, message?)` - Maximum value/length
- `before(value, message?)` - Before value/length
- `after(value, message?)` - After value/length
- `email(message?)` - Email format validation
- `regex(pattern, message?)` - Regular expression validation
- `equals(value, message?)` - Exact value matching
- `oneOf(values, message?)` - Must be one of specified values
- `isNumeric(message?)` - Numeric string validation
- `custom(name, params?, message?)` - Custom validation rule

### Conditions

- `eq(field, value)` - Field equals value
- `neq(field, value)` - Field not equals value
- `gt(field, value)` - Field greater than value
- `gte(field, value)` - Field greater than or equal
- `lt(field, value)` - Field less than value
- `lte(field, value)` - Field less than or equal
- `matches(field, pattern)` - Field matches regex pattern
- `and([...conditions])` - All conditions must be true
- `or([...conditions])` - At least one condition must be true

### Validation

- `validate(schema, currentValues?, newValues, options?)` - Main validation function
- `validateMutable` option - Check field mutability constraints (defaults to true)
- `customRules` option - Provide custom rule implementations

## Type Safety

dynz provides excellent TypeScript integration:

```typescript
import {
  array,
  min,
  number,
  object,
  string,
  validate,
  SchemaValues,
} from "dynz";

const schema = object({
  fields: {
    name: string({ rules: [min(1)] }),
    age: number({ required: false }),
    tags: array({ schema: string() }),
  },
});

// Inferred type: { name: string; age?: number; tags: string[] }
type UserData = SchemaValues<typeof schema>;

// Type-safe validation results
const result = validate(schema, undefined, {
  name: "John",
  tags: ["dynz"],
});

if (result.success) {
  // result.values is properly typed as UserData
  console.log(result.values.name); // ✅ Type-safe access
}
```

## Examples

Check out the `/examples` directory for complete working examples:

- **Next.js Example** - React forms with dynz schemas

## Comparison with Other Libraries

| Feature                | dynz           | Zod       | Yup        | Joi        |
| ---------------------- | -------------- | --------- | ---------- | ---------- |
| TypeScript Support     | ✅ Native      | ✅ Native | ⚠️ Partial | ❌ Runtime |
| Conditional Validation | ✅ Built-in    | ⚠️ Manual | ⚠️ Limited | ⚠️ Limited |
| Cross-field References | ✅ Native      | ⚠️ Manual | ✅ Native  | ✅ Native  |
| Privacy/Masking        | ✅ Built-in    | ❌        | ❌         | ❌         |
| Mutability Controls    | ✅ Native      | ❌        | ❌         | ❌         |
| Field Inclusion        | ✅ Conditional | ❌        | ❌         | ❌         |
| Bundle Size            | 🟡 Medium      | 🟢 Small  | 🟡 Medium  | 🔴 Large   |

## Advanced Features

### Complex Business Logic

```typescript
const loanApplicationSchema = object({
  fields: {
    applicantType: string({ rules: [oneOf(["individual", "business"])] }),

    income: number({
      rules: [min(0)],
      required: eq("applicantType", "individual"),
    }),

    businessRevenue: number({
      rules: [min(0)],
      required: eq("applicantType", "business"),
    }),

    loanAmount: number({
      rules: [
        min(1000),
        conditional({
          when: eq("applicantType", "individual"),
          then: max(ref("income")), // Can't exceed annual income
        }),
        conditional({
          when: eq("applicantType", "business"),
          then: max(ref("businessRevenue")), // Can't exceed annual revenue
        }),
      ],
    }),
  },
});
```

### Workflow Management

```typescript
const documentWorkflowSchema = object({
  fields: {
    content: string({
      mutable: and([
        eq("status", "draft"),
        or([eq("isOwner", true), eq("hasEditPermission", true)]),
      ]),
    }),

    status: string({
      rules: [oneOf(["draft", "review", "approved", "published"])],
      mutable: or([
        and([eq("currentStatus", "draft"), eq("isOwner", true)]),
        and([eq("currentStatus", "review"), eq("userRole", "reviewer")]),
        eq("userRole", "admin"),
      ]),
    }),
  },
});
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © dynz

## Related Packages

- More framework integrations coming soon...

---

Built with ❤️ for type-safe validation

[license-image]: https://img.shields.io/badge/License-MIT-brightgreen.svg?style=flat-square
[license-url]: https://opensource.org/licenses/MIT
[ci-image]: https://img.shields.io/github/actions/workflow/status/rubenvanrooij/dynz/ci.yml?branch=main&logo=github&style=flat-square
[ci-url]: https://github.com//rubenvanrooij/dynz/actions/workflows/ci.yml
[npm-image]: https://img.shields.io/npm/v/dynz.svg?style=flat-square
[npm-url]: https://npmjs.org/package/dynz
[downloads-image]: https://img.shields.io/npm/dm/dynz.svg?style=flat-square
