"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const schema_1 = require("./schema");
const rules_1 = require("./rules");
const types_1 = require("./types");
(0, vitest_1.describe)('schema', () => {
    (0, vitest_1.describe)('string', () => {
        (0, vitest_1.it)('should create basic string schema', () => {
            const schema = (0, schema_1.string)();
            (0, vitest_1.expect)(schema).toEqual({
                type: types_1.SchemaType.STRING
            });
        });
        (0, vitest_1.it)('should create string schema with options', () => {
            const schema = (0, schema_1.string)({
                required: true,
                default: 'hello',
                rules: [(0, rules_1.min)(3), (0, rules_1.max)(10)]
            });
            (0, vitest_1.expect)(schema).toEqual({
                type: types_1.SchemaType.STRING,
                required: true,
                default: 'hello',
                rules: [
                    { type: 'min', min: 3 },
                    { type: 'max', max: 10 }
                ]
            });
        });
        (0, vitest_1.it)('should create string schema with all properties', () => {
            const schema = (0, schema_1.string)({
                required: false,
                mutable: true,
                included: false,
                private: true,
                default: 'test'
            });
            (0, vitest_1.expect)(schema).toEqual({
                type: types_1.SchemaType.STRING,
                required: false,
                mutable: true,
                included: false,
                private: true,
                default: 'test'
            });
        });
    });
    (0, vitest_1.describe)('number', () => {
        (0, vitest_1.it)('should create basic number schema', () => {
            const schema = (0, schema_1.number)();
            (0, vitest_1.expect)(schema).toEqual({
                type: types_1.SchemaType.NUMBER
            });
        });
        (0, vitest_1.it)('should create number schema with options', () => {
            const schema = (0, schema_1.number)({
                required: true,
                default: 42,
                rules: [(0, rules_1.min)(0), (0, rules_1.max)(100)]
            });
            (0, vitest_1.expect)(schema).toEqual({
                type: types_1.SchemaType.NUMBER,
                required: true,
                default: 42,
                rules: [
                    { type: 'min', min: 0 },
                    { type: 'max', max: 100 }
                ]
            });
        });
        (0, vitest_1.it)('should create number schema with validation rules', () => {
            const schema = (0, schema_1.number)({
                rules: [(0, rules_1.min)(18), (0, rules_1.max)(65), (0, rules_1.equals)(25)]
            });
            (0, vitest_1.expect)(schema.type).toBe(types_1.SchemaType.NUMBER);
            (0, vitest_1.expect)(schema.rules).toHaveLength(3);
            (0, vitest_1.expect)(schema.rules?.[0]).toEqual({ type: 'min', min: 18 });
            (0, vitest_1.expect)(schema.rules?.[1]).toEqual({ type: 'max', max: 65 });
            (0, vitest_1.expect)(schema.rules?.[2]).toEqual({ type: 'equals', value: 25 });
        });
    });
    (0, vitest_1.describe)('object', () => {
        (0, vitest_1.it)('should create object schema with fields', () => {
            const schema = (0, schema_1.object)({
                fields: {
                    name: (0, schema_1.string)(),
                    age: (0, schema_1.number)()
                }
            });
            (0, vitest_1.expect)(schema).toEqual({
                type: types_1.SchemaType.OBJECT,
                fields: {
                    name: { type: types_1.SchemaType.STRING },
                    age: { type: types_1.SchemaType.NUMBER }
                }
            });
        });
        (0, vitest_1.it)('should create object schema with nested objects', () => {
            const schema = (0, schema_1.object)({
                fields: {
                    user: (0, schema_1.object)({
                        fields: {
                            profile: (0, schema_1.object)({
                                fields: {
                                    name: (0, schema_1.string)(),
                                    email: (0, schema_1.string)()
                                }
                            })
                        }
                    })
                }
            });
            (0, vitest_1.expect)(schema.type).toBe(types_1.SchemaType.OBJECT);
            (0, vitest_1.expect)(schema.fields.user.type).toBe(types_1.SchemaType.OBJECT);
            (0, vitest_1.expect)(schema.fields.user.fields.profile.type).toBe(types_1.SchemaType.OBJECT);
            (0, vitest_1.expect)(schema.fields.user.fields.profile.fields.name.type).toBe(types_1.SchemaType.STRING);
        });
        (0, vitest_1.it)('should create object schema with mixed field types', () => {
            const schema = (0, schema_1.object)({
                fields: {
                    id: (0, schema_1.number)(),
                    name: (0, schema_1.string)(),
                    tags: (0, schema_1.array)({ schema: (0, schema_1.string)() }),
                    metadata: (0, schema_1.object)({ fields: {} })
                },
                required: false
            });
            (0, vitest_1.expect)(schema).toEqual({
                type: types_1.SchemaType.OBJECT,
                required: false,
                fields: {
                    id: { type: types_1.SchemaType.NUMBER },
                    name: { type: types_1.SchemaType.STRING },
                    tags: { type: types_1.SchemaType.ARRAY, schema: { type: types_1.SchemaType.STRING } },
                    metadata: { type: types_1.SchemaType.OBJECT, fields: {} }
                }
            });
        });
    });
    (0, vitest_1.describe)('array', () => {
        (0, vitest_1.it)('should create array schema with string items', () => {
            const schema = (0, schema_1.array)({
                schema: (0, schema_1.string)()
            });
            (0, vitest_1.expect)(schema).toEqual({
                type: types_1.SchemaType.ARRAY,
                schema: { type: types_1.SchemaType.STRING }
            });
        });
        (0, vitest_1.it)('should create array schema with number items', () => {
            const schema = (0, schema_1.array)({
                schema: (0, schema_1.number)(),
                rules: [(0, rules_1.min)(1), (0, rules_1.max)(5)]
            });
            (0, vitest_1.expect)(schema).toEqual({
                type: types_1.SchemaType.ARRAY,
                schema: { type: types_1.SchemaType.NUMBER },
                rules: [
                    { type: 'min', min: 1 },
                    { type: 'max', max: 5 }
                ]
            });
        });
        (0, vitest_1.it)('should create array schema with object items', () => {
            const schema = (0, schema_1.array)({
                schema: (0, schema_1.object)({
                    fields: {
                        id: (0, schema_1.number)(),
                        name: (0, schema_1.string)()
                    }
                })
            });
            (0, vitest_1.expect)(schema.type).toBe(types_1.SchemaType.ARRAY);
            (0, vitest_1.expect)(schema.schema.type).toBe(types_1.SchemaType.OBJECT);
            (0, vitest_1.expect)(schema.schema.fields).toEqual({
                id: { type: types_1.SchemaType.NUMBER },
                name: { type: types_1.SchemaType.STRING }
            });
        });
        (0, vitest_1.it)('should create nested array schema', () => {
            const schema = (0, schema_1.array)({
                schema: (0, schema_1.array)({
                    schema: (0, schema_1.string)()
                })
            });
            (0, vitest_1.expect)(schema).toEqual({
                type: types_1.SchemaType.ARRAY,
                schema: {
                    type: types_1.SchemaType.ARRAY,
                    schema: { type: types_1.SchemaType.STRING }
                }
            });
        });
    });
    (0, vitest_1.describe)('dateString', () => {
        (0, vitest_1.it)('should create date string schema with default format', () => {
            const schema = (0, schema_1.dateString)();
            (0, vitest_1.expect)(schema).toEqual({
                type: types_1.SchemaType.DATE_STRING,
                format: schema_1.DEFAULT_DATE_STRING_FORMAT
            });
        });
        (0, vitest_1.it)('should create date string schema with custom format', () => {
            const schema = (0, schema_1.dateString)({
                format: 'MM/dd/yyyy'
            });
            (0, vitest_1.expect)(schema).toEqual({
                type: types_1.SchemaType.DATE_STRING,
                format: 'MM/dd/yyyy'
            });
        });
        (0, vitest_1.it)('should create date string schema with format and other options', () => {
            const schema = (0, schema_1.dateString)({
                format: 'dd-MM-yyyy',
                required: true,
                default: '01-01-2024'
            });
            (0, vitest_1.expect)(schema).toEqual({
                type: types_1.SchemaType.DATE_STRING,
                format: 'dd-MM-yyyy',
                required: true,
                default: '01-01-2024'
            });
        });
        (0, vitest_1.it)('should use default format when format is not provided in options', () => {
            const schema = (0, schema_1.dateString)({
                required: false
            });
            (0, vitest_1.expect)(schema).toEqual({
                type: types_1.SchemaType.DATE_STRING,
                format: schema_1.DEFAULT_DATE_STRING_FORMAT,
                required: false
            });
        });
    });
    (0, vitest_1.describe)('helper functions', () => {
        (0, vitest_1.describe)('optional', () => {
            (0, vitest_1.it)('should make schema optional', () => {
                const baseSchema = (0, schema_1.string)({ required: true });
                const optionalSchema = (0, schema_1.optional)(baseSchema);
                (0, vitest_1.expect)(optionalSchema).toEqual({
                    type: types_1.SchemaType.STRING,
                    required: false
                });
            });
            (0, vitest_1.it)('should override required property', () => {
                const baseSchema = (0, schema_1.number)({ required: true, default: 0 });
                const optionalSchema = (0, schema_1.optional)(baseSchema);
                (0, vitest_1.expect)(optionalSchema).toEqual({
                    type: types_1.SchemaType.NUMBER,
                    required: false,
                    default: 0
                });
            });
        });
        (0, vitest_1.describe)('required', () => {
            (0, vitest_1.it)('should make schema required', () => {
                const baseSchema = (0, schema_1.string)({ required: false });
                const requiredSchema = (0, schema_1.required)(baseSchema);
                (0, vitest_1.expect)(requiredSchema).toEqual({
                    type: types_1.SchemaType.STRING,
                    required: true
                });
            });
            (0, vitest_1.it)('should override required property', () => {
                const baseSchema = (0, schema_1.number)({ required: false, mutable: true });
                const requiredSchema = (0, schema_1.required)(baseSchema);
                (0, vitest_1.expect)(requiredSchema).toEqual({
                    type: types_1.SchemaType.NUMBER,
                    required: true,
                    mutable: true
                });
            });
        });
        (0, vitest_1.describe)('rules', () => {
            (0, vitest_1.it)('should add rules to schema', () => {
                const baseSchema = (0, schema_1.string)();
                const schemaWithRules = (0, schema_1.rules)(baseSchema, (0, rules_1.min)(3), (0, rules_1.max)(10));
                (0, vitest_1.expect)(schemaWithRules).toEqual({
                    type: types_1.SchemaType.STRING,
                    rules: [
                        { type: 'min', min: 3 },
                        { type: 'max', max: 10 }
                    ]
                });
            });
            (0, vitest_1.it)('should add single rule to schema', () => {
                const baseSchema = (0, schema_1.number)();
                const schemaWithRule = (0, schema_1.rules)(baseSchema, (0, rules_1.equals)(42));
                (0, vitest_1.expect)(schemaWithRule).toEqual({
                    type: types_1.SchemaType.NUMBER,
                    rules: [{ type: 'equals', value: 42 }]
                });
            });
            (0, vitest_1.it)('should preserve existing schema properties', () => {
                const baseSchema = (0, schema_1.string)({
                    required: true,
                    default: 'test',
                    mutable: false
                });
                const schemaWithRules = (0, schema_1.rules)(baseSchema, (0, rules_1.min)(1), (0, rules_1.max)(20));
                (0, vitest_1.expect)(schemaWithRules).toEqual({
                    type: types_1.SchemaType.STRING,
                    required: true,
                    default: 'test',
                    mutable: false,
                    rules: [
                        { type: 'min', min: 1 },
                        { type: 'max', max: 20 }
                    ]
                });
            });
            (0, vitest_1.it)('should work with complex rules', () => {
                const baseSchema = (0, schema_1.string)();
                const schemaWithRules = (0, schema_1.rules)(baseSchema, (0, rules_1.min)(5), (0, rules_1.max)(50), (0, rules_1.equals)('specific'), { type: 'regex', regex: '^[a-zA-Z]+$' });
                (0, vitest_1.expect)(schemaWithRules.rules).toHaveLength(4);
                (0, vitest_1.expect)(schemaWithRules.rules?.[0]).toEqual({ type: 'min', min: 5 });
                (0, vitest_1.expect)(schemaWithRules.rules?.[1]).toEqual({ type: 'max', max: 50 });
                (0, vitest_1.expect)(schemaWithRules.rules?.[2]).toEqual({ type: 'equals', value: 'specific' });
                (0, vitest_1.expect)(schemaWithRules.rules?.[3]).toEqual({ type: 'regex', regex: '^[a-zA-Z]+$' });
            });
        });
    });
    (0, vitest_1.describe)('complex schema compositions', () => {
        (0, vitest_1.it)('should create complex nested schema structure', () => {
            const userSchema = (0, schema_1.object)({
                fields: {
                    id: (0, schema_1.number)({ required: true }),
                    name: (0, schema_1.string)({ required: true, rules: [(0, rules_1.min)(2), (0, rules_1.max)(50)] }),
                    email: (0, schema_1.optional)((0, schema_1.string)({ rules: [{ type: 'regex', regex: '^[^@]+@[^@]+$' }] })),
                    addresses: (0, schema_1.array)({
                        schema: (0, schema_1.object)({
                            fields: {
                                street: (0, schema_1.string)({ required: true }),
                                city: (0, schema_1.string)({ required: true }),
                                country: (0, schema_1.string)({ default: 'US' })
                            }
                        }),
                        rules: [(0, rules_1.max)(3)]
                    }),
                    createdAt: (0, schema_1.dateString)({
                        format: 'yyyy-MM-dd',
                        required: true
                    })
                }
            });
            (0, vitest_1.expect)(userSchema.type).toBe(types_1.SchemaType.OBJECT);
            (0, vitest_1.expect)(userSchema.fields.id.required).toBe(true);
            (0, vitest_1.expect)(userSchema.fields.name.rules).toHaveLength(2);
            (0, vitest_1.expect)(userSchema.fields.email.required).toBe(false);
            (0, vitest_1.expect)(userSchema.fields.addresses.type).toBe(types_1.SchemaType.ARRAY);
            (0, vitest_1.expect)(userSchema.fields.addresses.schema.type).toBe(types_1.SchemaType.OBJECT);
            (0, vitest_1.expect)(userSchema.fields.createdAt.format).toBe('yyyy-MM-dd');
        });
        (0, vitest_1.it)('should handle schemas with conditional properties', () => {
            const schema = (0, schema_1.object)({
                fields: {
                    type: (0, schema_1.string)(),
                    conditionalField: (0, schema_1.string)({
                        required: {
                            type: 'eq',
                            path: 'type',
                            value: 'special'
                        }
                    })
                }
            });
            (0, vitest_1.expect)(schema.fields.conditionalField.required).toEqual({
                type: 'eq',
                path: 'type',
                value: 'special'
            });
        });
    });
});
