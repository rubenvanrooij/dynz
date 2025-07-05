import { describe, it, expect } from 'vitest';
import { validate } from './validate';
import { string, number, object, array, dateString } from './schema';
import { min, max, regex, equals, isNumeric } from './rules';
import { ErrorCode, SchemaType } from './types';

describe('validate', () => {
  describe('basic validation', () => {
    it('should validate a simple string schema', () => {
      const schema = string();
      const result = validate(schema, undefined, 'hello');
      
      expect(result).toEqual({
        success: true,
        values: 'hello'
      });
    });

    it('should validate a simple number schema', () => {
      const schema = number();
      const result = validate(schema, undefined, 42);
      
      expect(result).toEqual({
        success: true,
        values: 42
      });
    });

    it('should validate an object schema', () => {
      const schema = object({
        fields: {
          name: string(),
          age: number()
        }
      });
      const result = validate(schema, undefined, { name: 'John', age: 30 });
      
      expect(result).toEqual({
        success: true,
        values: { name: 'John', age: 30 }
      });
    });
  });

  describe('required validation', () => {
    it('should fail when required field is missing', () => {
      const schema = string({ required: true });
      const result = validate(schema, undefined, undefined);
      
      expect(result).toEqual({
        success: false,
        errors: [expect.objectContaining({
          code: ErrorCode.REQRUIED,
          path: '$'
        })]
      });
    });

    it('should pass when required field is present', () => {
      const schema = string({ required: true });
      const result = validate(schema, undefined, 'hello');
      
      expect(result.success).toBe(true);
    });

    it('should pass when optional field is missing', () => {
      const schema = string({ required: false });
      const result = validate(schema, undefined, undefined);
      
      expect(result.success).toBe(true);
    });
  });

  describe('type validation', () => {
    it('should fail when string value is not a string', () => {
      const schema = string();
      const result = validate(schema, undefined, 42);
      
      expect(result).toEqual({
        success: false,
        errors: [expect.objectContaining({
          code: ErrorCode.TYPE,
          expectedType: SchemaType.STRING
        })]
      });
    });

    it('should fail when number value is not a number', () => {
      const schema = number();
      const result = validate(schema, undefined, 'not a number');
      
      expect(result).toEqual({
        success: false,
        errors: [expect.objectContaining({
          code: ErrorCode.TYPE,
          expectedType: SchemaType.NUMBER
        })]
      });
    });

    it('should fail when object value is not an object', () => {
      const schema = object({ fields: {} });
      const result = validate(schema, undefined, 'not an object');
      
      expect(result).toEqual({
        success: false,
        errors: [expect.objectContaining({
          code: ErrorCode.TYPE,
          expectedType: SchemaType.OBJECT
        })]
      });
    });

    it('should fail when array value is not an array', () => {
      const schema = array({ schema: string() });
      const result = validate(schema, undefined, 'not an array');
      
      expect(result).toEqual({
        success: false,
        errors: [expect.objectContaining({
          code: ErrorCode.TYPE,
          expectedType: SchemaType.ARRAY
        })]
      });
    });
  });

  describe('date string validation', () => {
    it('should validate a valid date string', () => {
      const schema = dateString();
      const result = validate(schema, undefined, '2023-12-25');
      
      expect(result).toEqual({
        success: true,
        values: '2023-12-25'
      });
    });

    it('should fail when date string format is invalid', () => {
      const schema = dateString();
      const result = validate(schema, undefined, 'invalid-date');
      
      expect(result).toEqual({
        success: false,
        errors: [expect.objectContaining({
          code: ErrorCode.TYPE,
          expectedType: SchemaType.DATE_STRING
        })]
      });
    });

    it('should validate custom date format', () => {
      const schema = dateString({ format: 'MM/dd/yyyy' });
      const result = validate(schema, undefined, '12/25/2023');
      
      expect(result).toEqual({
        success: true,
        values: '12/25/2023'
      });
    });
  });

  describe('included validation', () => {
    it('should fail when value is provided for non-included schema', () => {
      const schema = string({ included: false });
      const result = validate(schema, undefined, 'hello');
      
      expect(result).toEqual({
        success: false,
        errors: [expect.objectContaining({
          code: ErrorCode.INCLUDED,
          path: '$'
        })]
      });
    });

    it('should pass when no value is provided for non-included schema', () => {
      const schema = string({ included: false });
      const result = validate(schema, undefined, undefined);
      
      expect(result).toEqual({
        success: true,
        values: undefined
      });
    });
  });

  describe('mutability validation', () => {
    it('should fail when immutable field is changed', () => {
      const schema = string({ mutable: false });
      const result = validate(schema, 'original', 'changed');
      
      expect(result).toEqual({
        success: false,
        errors: [expect.objectContaining({
          code: ErrorCode.IMMUTABLE,
          path: '$'
        })]
      });
    });

    it('should pass when immutable field is not changed', () => {
      const schema = string({ mutable: false });
      const result = validate(schema, 'same', 'same');
      
      expect(result.success).toBe(true);
    });

    it('should pass when mutable field is changed', () => {
      const schema = string({ mutable: true });
      const result = validate(schema, 'original', 'changed');
      
      expect(result.success).toBe(true);
    });
  });

  describe('nested object validation', () => {
    it('should validate nested object fields', () => {
      const schema = object({
        fields: {
          user: object({
            fields: {
              name: string(),
              age: number()
            }
          })
        }
      });
      
      const result = validate(schema, undefined, {
        user: { name: 'John', age: 30 }
      });
      
      expect(result.success).toBe(true);
    });

    it('should fail validation for nested object with invalid field', () => {
      const schema = object({
        fields: {
          user: object({
            fields: {
              name: string(),
              age: number()
            }
          })
        }
      });
      
      const result = validate(schema, undefined, {
        user: { name: 'John', age: 'not a number' }
      });
      
      expect(result).toEqual({
        success: false,
        errors: [expect.objectContaining({
          code: ErrorCode.TYPE,
          path: '$.user.age'
        })]
      });
    });
  });

  describe('array validation', () => {
    it('should validate array of strings', () => {
      const schema = array({ schema: string() });
      const result = validate(schema, undefined, ['hello', 'world']);
      
      expect(result).toEqual({
        success: true,
        values: ['hello', 'world']
      });
    });

    it('should fail validation for array with invalid item', () => {
      const schema = array({ schema: string() });
      const result = validate(schema, undefined, ['hello', 42]);
      
      expect(result).toEqual({
        success: false,
        errors: [expect.objectContaining({
          code: ErrorCode.TYPE,
          path: '$.[1]'
        })]
      });
    });
  });

  describe('validation rules', () => {
    describe('min rule', () => {
      it('should pass when string length meets minimum', () => {
        const schema = string({ rules: [min(3)] });
        const result = validate(schema, undefined, 'hello');
        
        expect(result.success).toBe(true);
      });

      it('should fail when string length is below minimum', () => {
        const schema = string({ rules: [min(5)] });
        const result = validate(schema, undefined, 'hi');
        
        expect(result).toEqual({
          success: false,
          errors: [expect.objectContaining({
            code: ErrorCode.MIN,
            min: 5
          })]
        });
      });

      it('should pass when number meets minimum', () => {
        const schema = number({ rules: [min(10)] });
        const result = validate(schema, undefined, 15);
        
        expect(result.success).toBe(true);
      });

      it('should fail when number is below minimum', () => {
        const schema = number({ rules: [min(10)] });
        const result = validate(schema, undefined, 5);
        
        expect(result).toEqual({
          success: false,
          errors: [expect.objectContaining({
            code: ErrorCode.MIN,
            min: 10
          })]
        });
      });
    });

    describe('max rule', () => {
      it('should pass when string length is within maximum', () => {
        const schema = string({ rules: [max(10)] });
        const result = validate(schema, undefined, 'hello');
        
        expect(result.success).toBe(true);
      });

      it('should fail when string length exceeds maximum', () => {
        const schema = string({ rules: [max(3)] });
        const result = validate(schema, undefined, 'hello');
        
        expect(result).toEqual({
          success: false,
          errors: [expect.objectContaining({
            code: ErrorCode.MAX,
            max: 3
          })]
        });
      });

      it('should pass when number is within maximum', () => {
        const schema = number({ rules: [max(100)] });
        const result = validate(schema, undefined, 50);
        
        expect(result.success).toBe(true);
      });

      it('should fail when number exceeds maximum', () => {
        const schema = number({ rules: [max(10)] });
        const result = validate(schema, undefined, 15);
        
        expect(result).toEqual({
          success: false,
          errors: [expect.objectContaining({
            code: ErrorCode.MAX,
            max: 10
          })]
        });
      });
    });

    describe('equals rule', () => {
      it('should pass when value equals expected', () => {
        const schema = string({ rules: [equals('hello')] });
        const result = validate(schema, undefined, 'hello');
        
        expect(result.success).toBe(true);
      });

      it('should fail when value does not equal expected', () => {
        const schema = string({ rules: [equals('hello')] });
        const result = validate(schema, undefined, 'world');
        
        expect(result).toEqual({
          success: false,
          errors: [expect.objectContaining({
            code: ErrorCode.EQUALS,
            equals: 'hello'
          })]
        });
      });

      it('should pass when number equals expected', () => {
        const schema = number({ rules: [equals(42)] });
        const result = validate(schema, undefined, 42);
        
        expect(result.success).toBe(true);
      });

      it('should fail when number does not equal expected', () => {
        const schema = number({ rules: [equals(42)] });
        const result = validate(schema, undefined, 24);
        
        expect(result).toEqual({
          success: false,
          errors: [expect.objectContaining({
            code: ErrorCode.EQUALS,
            equals: 42
          })]
        });
      });
    });

    describe('regex rule', () => {
      it('should pass when string matches regex', () => {
        const schema = string({ rules: [regex('^[a-z]+$')] });
        const result = validate(schema, undefined, 'hello');
        
        expect(result.success).toBe(true);
      });

      it('should fail when string does not match regex', () => {
        const schema = string({ rules: [regex('^[a-z]+$')] });
        const result = validate(schema, undefined, 'Hello123');
        
        expect(result).toEqual({
          success: false,
          errors: [expect.objectContaining({
            code: ErrorCode.REGEX,
            regex: '^[a-z]+$'
          })]
        });
      });

      it('should validate email format', () => {
        const emailRegex = '^[^@]+@[^@]+\\.[^@]+$';
        const schema = string({ rules: [regex(emailRegex)] });
        
        const validResult = validate(schema, undefined, 'test@example.com');
        expect(validResult.success).toBe(true);
        
        const invalidResult = validate(schema, undefined, 'invalid-email');
        expect(invalidResult.success).toBe(false);
      });
    });

    describe('isNumeric rule', () => {
      it('should pass when string is numeric', () => {
        const schema = string({ rules: [isNumeric()] });
        const result = validate(schema, undefined, '123');
        
        expect(result.success).toBe(true);
      });

      it('should pass when string is decimal', () => {
        const schema = string({ rules: [isNumeric()] });
        const result = validate(schema, undefined, '123.45');
        
        expect(result.success).toBe(true);
      });

      it('should fail when string is not numeric', () => {
        const schema = string({ rules: [isNumeric()] });
        const result = validate(schema, undefined, 'abc123');
        
        expect(result).toEqual({
          success: false,
          errors: [expect.objectContaining({
            code: ErrorCode.IS_NUMERIC
          })]
        });
      });
    });

    describe('combined rules', () => {
      it('should validate multiple rules on same field', () => {
        const schema = string({ rules: [min(3), max(10), regex('^[a-z]+$')] });
        const result = validate(schema, undefined, 'hello');
        
        expect(result.success).toBe(true);
      });

      it('should fail when one of multiple rules fails', () => {
        const schema = string({ rules: [min(3), max(10), regex('^[a-z]+$')] });
        const result = validate(schema, undefined, 'Hello');
        
        expect(result).toEqual({
          success: false,
          errors: [expect.objectContaining({
            code: ErrorCode.REGEX
          })]
        });
      });
    });
  });
});