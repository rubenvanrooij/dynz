"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const validate_1 = require("./validate");
const schema_1 = require("./schema");
const rules_1 = require("./rules");
const types_1 = require("./types");
(0, vitest_1.describe)('validate', () => {
    (0, vitest_1.describe)('basic validation', () => {
        (0, vitest_1.it)('should validate a simple string schema', () => {
            const schema = (0, schema_1.string)();
            const result = (0, validate_1.validate)(schema, undefined, 'hello');
            (0, vitest_1.expect)(result).toEqual({
                success: true,
                values: 'hello'
            });
        });
        (0, vitest_1.it)('should validate a simple number schema', () => {
            const schema = (0, schema_1.number)();
            const result = (0, validate_1.validate)(schema, undefined, 42);
            (0, vitest_1.expect)(result).toEqual({
                success: true,
                values: 42
            });
        });
        (0, vitest_1.it)('should validate an object schema', () => {
            const schema = (0, schema_1.object)({
                fields: {
                    name: (0, schema_1.string)(),
                    age: (0, schema_1.number)()
                }
            });
            const result = (0, validate_1.validate)(schema, undefined, { name: 'John', age: 30 });
            (0, vitest_1.expect)(result).toEqual({
                success: true,
                values: { name: 'John', age: 30 }
            });
        });
    });
    (0, vitest_1.describe)('required validation', () => {
        (0, vitest_1.it)('should fail when required field is missing', () => {
            const schema = (0, schema_1.string)({ required: true });
            const result = (0, validate_1.validate)(schema, undefined, undefined);
            (0, vitest_1.expect)(result).toEqual({
                success: false,
                errors: [vitest_1.expect.objectContaining({
                        code: types_1.ErrorCode.REQRUIED,
                        path: '$'
                    })]
            });
        });
        (0, vitest_1.it)('should pass when required field is present', () => {
            const schema = (0, schema_1.string)({ required: true });
            const result = (0, validate_1.validate)(schema, undefined, 'hello');
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should pass when optional field is missing', () => {
            const schema = (0, schema_1.string)({ required: false });
            const result = (0, validate_1.validate)(schema, undefined, undefined);
            (0, vitest_1.expect)(result.success).toBe(true);
        });
    });
    (0, vitest_1.describe)('type validation', () => {
        (0, vitest_1.it)('should fail when string value is not a string', () => {
            const schema = (0, schema_1.string)();
            const result = (0, validate_1.validate)(schema, undefined, 42);
            (0, vitest_1.expect)(result).toEqual({
                success: false,
                errors: [vitest_1.expect.objectContaining({
                        code: types_1.ErrorCode.TYPE,
                        expectedType: types_1.SchemaType.STRING
                    })]
            });
        });
        (0, vitest_1.it)('should fail when number value is not a number', () => {
            const schema = (0, schema_1.number)();
            const result = (0, validate_1.validate)(schema, undefined, 'not a number');
            (0, vitest_1.expect)(result).toEqual({
                success: false,
                errors: [vitest_1.expect.objectContaining({
                        code: types_1.ErrorCode.TYPE,
                        expectedType: types_1.SchemaType.NUMBER
                    })]
            });
        });
        (0, vitest_1.it)('should fail when object value is not an object', () => {
            const schema = (0, schema_1.object)({ fields: {} });
            const result = (0, validate_1.validate)(schema, undefined, 'not an object');
            (0, vitest_1.expect)(result).toEqual({
                success: false,
                errors: [vitest_1.expect.objectContaining({
                        code: types_1.ErrorCode.TYPE,
                        expectedType: types_1.SchemaType.OBJECT
                    })]
            });
        });
        (0, vitest_1.it)('should fail when array value is not an array', () => {
            const schema = (0, schema_1.array)({ schema: (0, schema_1.string)() });
            const result = (0, validate_1.validate)(schema, undefined, 'not an array');
            (0, vitest_1.expect)(result).toEqual({
                success: false,
                errors: [vitest_1.expect.objectContaining({
                        code: types_1.ErrorCode.TYPE,
                        expectedType: types_1.SchemaType.ARRAY
                    })]
            });
        });
    });
    (0, vitest_1.describe)('date string validation', () => {
        (0, vitest_1.it)('should validate a valid date string', () => {
            const schema = (0, schema_1.dateString)();
            const result = (0, validate_1.validate)(schema, undefined, '2023-12-25');
            (0, vitest_1.expect)(result).toEqual({
                success: true,
                values: '2023-12-25'
            });
        });
        (0, vitest_1.it)('should fail when date string format is invalid', () => {
            const schema = (0, schema_1.dateString)();
            const result = (0, validate_1.validate)(schema, undefined, 'invalid-date');
            (0, vitest_1.expect)(result).toEqual({
                success: false,
                errors: [vitest_1.expect.objectContaining({
                        code: types_1.ErrorCode.TYPE,
                        expectedType: types_1.SchemaType.DATE_STRING
                    })]
            });
        });
        (0, vitest_1.it)('should validate custom date format', () => {
            const schema = (0, schema_1.dateString)({ format: 'MM/dd/yyyy' });
            const result = (0, validate_1.validate)(schema, undefined, '12/25/2023');
            (0, vitest_1.expect)(result).toEqual({
                success: true,
                values: '12/25/2023'
            });
        });
    });
    (0, vitest_1.describe)('included validation', () => {
        (0, vitest_1.it)('should fail when value is provided for non-included schema', () => {
            const schema = (0, schema_1.string)({ included: false });
            const result = (0, validate_1.validate)(schema, undefined, 'hello');
            (0, vitest_1.expect)(result).toEqual({
                success: false,
                errors: [vitest_1.expect.objectContaining({
                        code: types_1.ErrorCode.INCLUDED,
                        path: '$'
                    })]
            });
        });
        (0, vitest_1.it)('should pass when no value is provided for non-included schema', () => {
            const schema = (0, schema_1.string)({ included: false });
            const result = (0, validate_1.validate)(schema, undefined, undefined);
            (0, vitest_1.expect)(result).toEqual({
                success: true,
                values: undefined
            });
        });
    });
    (0, vitest_1.describe)('mutability validation', () => {
        (0, vitest_1.it)('should fail when immutable field is changed', () => {
            const schema = (0, schema_1.string)({ mutable: false });
            const result = (0, validate_1.validate)(schema, 'original', 'changed');
            (0, vitest_1.expect)(result).toEqual({
                success: false,
                errors: [vitest_1.expect.objectContaining({
                        code: types_1.ErrorCode.IMMUTABLE,
                        path: '$'
                    })]
            });
        });
        (0, vitest_1.it)('should pass when immutable field is not changed', () => {
            const schema = (0, schema_1.string)({ mutable: false });
            const result = (0, validate_1.validate)(schema, 'same', 'same');
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should pass when mutable field is changed', () => {
            const schema = (0, schema_1.string)({ mutable: true });
            const result = (0, validate_1.validate)(schema, 'original', 'changed');
            (0, vitest_1.expect)(result.success).toBe(true);
        });
    });
    (0, vitest_1.describe)('nested object validation', () => {
        (0, vitest_1.it)('should validate nested object fields', () => {
            const schema = (0, schema_1.object)({
                fields: {
                    user: (0, schema_1.object)({
                        fields: {
                            name: (0, schema_1.string)(),
                            age: (0, schema_1.number)()
                        }
                    })
                }
            });
            const result = (0, validate_1.validate)(schema, undefined, {
                user: { name: 'John', age: 30 }
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('should fail validation for nested object with invalid field', () => {
            const schema = (0, schema_1.object)({
                fields: {
                    user: (0, schema_1.object)({
                        fields: {
                            name: (0, schema_1.string)(),
                            age: (0, schema_1.number)()
                        }
                    })
                }
            });
            const result = (0, validate_1.validate)(schema, undefined, {
                user: { name: 'John', age: 'not a number' }
            });
            (0, vitest_1.expect)(result).toEqual({
                success: false,
                errors: [vitest_1.expect.objectContaining({
                        code: types_1.ErrorCode.TYPE,
                        path: '$.user.age'
                    })]
            });
        });
    });
    (0, vitest_1.describe)('array validation', () => {
        (0, vitest_1.it)('should validate array of strings', () => {
            const schema = (0, schema_1.array)({ schema: (0, schema_1.string)() });
            const result = (0, validate_1.validate)(schema, undefined, ['hello', 'world']);
            (0, vitest_1.expect)(result).toEqual({
                success: true,
                values: ['hello', 'world']
            });
        });
        (0, vitest_1.it)('should fail validation for array with invalid item', () => {
            const schema = (0, schema_1.array)({ schema: (0, schema_1.string)() });
            const result = (0, validate_1.validate)(schema, undefined, ['hello', 42]);
            (0, vitest_1.expect)(result).toEqual({
                success: false,
                errors: [vitest_1.expect.objectContaining({
                        code: types_1.ErrorCode.TYPE,
                        path: '$[1]'
                    })]
            });
        });
    });
    (0, vitest_1.describe)('validation rules', () => {
        (0, vitest_1.describe)('min rule', () => {
            (0, vitest_1.it)('should pass when string length meets minimum', () => {
                const schema = (0, schema_1.string)({ rules: [(0, rules_1.min)(3)] });
                const result = (0, validate_1.validate)(schema, undefined, 'hello');
                (0, vitest_1.expect)(result.success).toBe(true);
            });
            (0, vitest_1.it)('should fail when string length is below minimum', () => {
                const schema = (0, schema_1.string)({ rules: [(0, rules_1.min)(5)] });
                const result = (0, validate_1.validate)(schema, undefined, 'hi');
                (0, vitest_1.expect)(result).toEqual({
                    success: false,
                    errors: [vitest_1.expect.objectContaining({
                            code: types_1.ErrorCode.MIN,
                            min: 5
                        })]
                });
            });
            (0, vitest_1.it)('should pass when number meets minimum', () => {
                const schema = (0, schema_1.number)({ rules: [(0, rules_1.min)(10)] });
                const result = (0, validate_1.validate)(schema, undefined, 15);
                (0, vitest_1.expect)(result.success).toBe(true);
            });
            (0, vitest_1.it)('should fail when number is below minimum', () => {
                const schema = (0, schema_1.number)({ rules: [(0, rules_1.min)(10)] });
                const result = (0, validate_1.validate)(schema, undefined, 5);
                (0, vitest_1.expect)(result).toEqual({
                    success: false,
                    errors: [vitest_1.expect.objectContaining({
                            code: types_1.ErrorCode.MIN,
                            min: 10
                        })]
                });
            });
        });
        (0, vitest_1.describe)('max rule', () => {
            (0, vitest_1.it)('should pass when string length is within maximum', () => {
                const schema = (0, schema_1.string)({ rules: [(0, rules_1.max)(10)] });
                const result = (0, validate_1.validate)(schema, undefined, 'hello');
                (0, vitest_1.expect)(result.success).toBe(true);
            });
            (0, vitest_1.it)('should fail when string length exceeds maximum', () => {
                const schema = (0, schema_1.string)({ rules: [(0, rules_1.max)(3)] });
                const result = (0, validate_1.validate)(schema, undefined, 'hello');
                (0, vitest_1.expect)(result).toEqual({
                    success: false,
                    errors: [vitest_1.expect.objectContaining({
                            code: types_1.ErrorCode.MAX,
                            max: 3
                        })]
                });
            });
            (0, vitest_1.it)('should pass when number is within maximum', () => {
                const schema = (0, schema_1.number)({ rules: [(0, rules_1.max)(100)] });
                const result = (0, validate_1.validate)(schema, undefined, 50);
                (0, vitest_1.expect)(result.success).toBe(true);
            });
            (0, vitest_1.it)('should fail when number exceeds maximum', () => {
                const schema = (0, schema_1.number)({ rules: [(0, rules_1.max)(10)] });
                const result = (0, validate_1.validate)(schema, undefined, 15);
                (0, vitest_1.expect)(result).toEqual({
                    success: false,
                    errors: [vitest_1.expect.objectContaining({
                            code: types_1.ErrorCode.MAX,
                            max: 10
                        })]
                });
            });
        });
        (0, vitest_1.describe)('equals rule', () => {
            (0, vitest_1.it)('should pass when value equals expected', () => {
                const schema = (0, schema_1.string)({ rules: [(0, rules_1.equals)('hello')] });
                const result = (0, validate_1.validate)(schema, undefined, 'hello');
                (0, vitest_1.expect)(result.success).toBe(true);
            });
            (0, vitest_1.it)('should fail when value does not equal expected', () => {
                const schema = (0, schema_1.string)({ rules: [(0, rules_1.equals)('hello')] });
                const result = (0, validate_1.validate)(schema, undefined, 'world');
                (0, vitest_1.expect)(result).toEqual({
                    success: false,
                    errors: [vitest_1.expect.objectContaining({
                            code: types_1.ErrorCode.EQUALS,
                            equals: 'hello'
                        })]
                });
            });
            (0, vitest_1.it)('should pass when number equals expected', () => {
                const schema = (0, schema_1.number)({ rules: [(0, rules_1.equals)(42)] });
                const result = (0, validate_1.validate)(schema, undefined, 42);
                (0, vitest_1.expect)(result.success).toBe(true);
            });
            (0, vitest_1.it)('should fail when number does not equal expected', () => {
                const schema = (0, schema_1.number)({ rules: [(0, rules_1.equals)(42)] });
                const result = (0, validate_1.validate)(schema, undefined, 24);
                (0, vitest_1.expect)(result).toEqual({
                    success: false,
                    errors: [vitest_1.expect.objectContaining({
                            code: types_1.ErrorCode.EQUALS,
                            equals: 42
                        })]
                });
            });
        });
        (0, vitest_1.describe)('regex rule', () => {
            (0, vitest_1.it)('should pass when string matches regex', () => {
                const schema = (0, schema_1.string)({ rules: [(0, rules_1.regex)('^[a-z]+$')] });
                const result = (0, validate_1.validate)(schema, undefined, 'hello');
                (0, vitest_1.expect)(result.success).toBe(true);
            });
            (0, vitest_1.it)('should fail when string does not match regex', () => {
                const schema = (0, schema_1.string)({ rules: [(0, rules_1.regex)('^[a-z]+$')] });
                const result = (0, validate_1.validate)(schema, undefined, 'Hello123');
                (0, vitest_1.expect)(result).toEqual({
                    success: false,
                    errors: [vitest_1.expect.objectContaining({
                            code: types_1.ErrorCode.REGEX,
                            regex: '^[a-z]+$'
                        })]
                });
            });
            (0, vitest_1.it)('should validate email format', () => {
                const emailRegex = '^[^@]+@[^@]+\\.[^@]+$';
                const schema = (0, schema_1.string)({ rules: [(0, rules_1.regex)(emailRegex)] });
                const validResult = (0, validate_1.validate)(schema, undefined, 'test@example.com');
                (0, vitest_1.expect)(validResult.success).toBe(true);
                const invalidResult = (0, validate_1.validate)(schema, undefined, 'invalid-email');
                (0, vitest_1.expect)(invalidResult.success).toBe(false);
            });
        });
        (0, vitest_1.describe)('isNumeric rule', () => {
            (0, vitest_1.it)('should pass when string is numeric', () => {
                const schema = (0, schema_1.string)({ rules: [(0, rules_1.isNumeric)()] });
                const result = (0, validate_1.validate)(schema, undefined, '123');
                (0, vitest_1.expect)(result.success).toBe(true);
            });
            (0, vitest_1.it)('should pass when string is decimal', () => {
                const schema = (0, schema_1.string)({ rules: [(0, rules_1.isNumeric)()] });
                const result = (0, validate_1.validate)(schema, undefined, '123.45');
                (0, vitest_1.expect)(result.success).toBe(true);
            });
            (0, vitest_1.it)('should fail when string is not numeric', () => {
                const schema = (0, schema_1.string)({ rules: [(0, rules_1.isNumeric)()] });
                const result = (0, validate_1.validate)(schema, undefined, 'abc123');
                (0, vitest_1.expect)(result).toEqual({
                    success: false,
                    errors: [vitest_1.expect.objectContaining({
                            code: types_1.ErrorCode.IS_NUMERIC
                        })]
                });
            });
        });
        (0, vitest_1.describe)('combined rules', () => {
            (0, vitest_1.it)('should validate multiple rules on same field', () => {
                const schema = (0, schema_1.string)({ rules: [(0, rules_1.min)(3), (0, rules_1.max)(10), (0, rules_1.regex)('^[a-z]+$')] });
                const result = (0, validate_1.validate)(schema, undefined, 'hello');
                (0, vitest_1.expect)(result.success).toBe(true);
            });
            (0, vitest_1.it)('should fail when one of multiple rules fails', () => {
                const schema = (0, schema_1.string)({ rules: [(0, rules_1.min)(3), (0, rules_1.max)(10), (0, rules_1.regex)('^[a-z]+$')] });
                const result = (0, validate_1.validate)(schema, undefined, 'Hello');
                (0, vitest_1.expect)(result).toEqual({
                    success: false,
                    errors: [vitest_1.expect.objectContaining({
                            code: types_1.ErrorCode.REGEX
                        })]
                });
            });
        });
    });
});
