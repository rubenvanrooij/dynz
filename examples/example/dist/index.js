"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./types"), exports);
// const schema = object({
//   required: val(true),
//   fields: {
//     test: object({
//       required: eq('foo', val('bar')),
//       fields: {
//         names: array({
//           required: val(true),
//           default: ['foo'],
//           rules: [min(2), max(3)],
//           schema: string({ default: '123', required: val(true) }),
//         }),
//         birthDate: dateString({
//           required: val(true),
//           rules: [min('2023-01-01'), equals(val('2023-10-01'))],
//         }),
//         firstName: string({
//           private: true,
//           required: val(true),
//           rules: [equals(ref('$.test.names[0]'))],
//         }),
//         age: number({
//           required: val(true),
//           rules: [min(1), max(3)],
//         }),
//       },
//     }),
//   },
// });
// // const current = {
// //   test: {
// //     names: ['1'],
// //     firstName: plain<string>(undefined),
// //     birthDate: '2023-10-01' as const,
// //     age: 3,
// //   },
// // };
// // const values = {
// //   test: {
// //     names: ['1'],
// //     firstName: plain('1'),
// //     birthDate: '202-10-01' as const,
// //     age: 3,
// //   },
// // };
// // type A = SchemaValues<typeof stringSchema>;
// // const resolvedSchema = resolve(schema, values);
// // const result = validate(resolvedSchema, current, values)
// // if (result.success) {
// //   const val = result.values
// // }
// // console.log(JSON.stringify(result, undefined, 2));
// const bsnSchema = string({ default: 'foo', mutable: val(false), rules: [equals(val('foo'))], private: false })
// const newValue = undefined
// const resolvedSchema = resolve(bsnSchema, newValue)
// const result = validate(resolvedSchema, 'foo', newValue)
// console.log(result)
// // if(result.success === false) {
// //   for(const error of result.errors) {
// //     if (error.code === ErrorCode.MAX_PRECISION) {
// //         error.maxPrecision
// //     } else {
// //       console.error(`Error at ${error.path.join('.')} - ${error.message}`);
// //     }
// //   }
// // }
