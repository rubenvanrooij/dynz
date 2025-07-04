"use strict";
// import { resolve } from './resolve';
// import { val } from './rules';
// import { object, string } from './schema';
// import { Schema } from './types';
// import { validate } from './validate';
Object.defineProperty(exports, "__esModule", { value: true });
// function reslolveAndValidate<T extends Schema>(schema: T, currentValues: unknown, newValues: unknown) {
//   return validate(resolve(schema, newValues), currentValues, newValues)
// }
// describe('validate', () => {
//   describe('included', () => {
//     it('should return an error when a value is present for a non included schema', () => {
//       const result = reslolveAndValidate(string({
//         included: val(false)
//       }), 'Hello World', 'Hello World')
//       expect(result).toEqual({
//         errors: [{ code: "INCLUDED", path: "$" }],
//         success: false
//       })
//     })
//   })
//   describe('mutability', () => {
//     it('should not allow mutation of nested objects on immutable schemas', () => {
//       const result = reslolveAndValidate(object({
//         mutable: val(false),
//         fields: {
//           foo: string({}),
//           bar: string({})
//         }
//       }), { foo: 'bar' }, { bar: 'foo' })
//       expect(result).toEqual({
//         errors: [{ code: "IMMUTABLE", path: "$" }],
//         success: false
//       })
//     })
//   })
//   // it.each`
//   //   schema                                                      | currentValue     | newValue
//   //   ${string({ mutable: val(false) })}                          | ${'Hello world'} | ${'Hello univerise'}
//   //   ${object({ fields: { foo: string({}), bar: string({}) } })} | ${{}}            | ${{}}
//   // `('foo', ({ schema, currentValue, newValue }) => {
//   //   const { success } = validate(resolve(schema, newValue), currentValue, newValue);
//   //   expect(success).toEqual(false);
//   // });
//   // it('should not allow mutating a value when a scheme is defined as immutable', () => {
//   //   const schema = string({ mutable: val(false) });
//   //   const currentValue = 'Hello universe';
//   //   const newValue = 'Hello world';
//   //   resolve(schema, newValue);
//   //   expect(validate(resolve(schema, newValue), currentValue, newValue)).toEqual({
//   //     errors: [{ code: 'IMMUTABLE', path: '$' }],
//   //     success: false,
//   //   });
//   // });
// });
