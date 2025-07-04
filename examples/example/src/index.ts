import { eq, gt } from 'dynz/conditions';
import { equals, min, ref } from 'dynz/rules';
import { dateString, number, object, string } from 'dynz/schema';
import { SchemaValues } from 'dynz/types';
import { validate } from 'dynz/validate';

const schema = object({
  fields: {
    age: number({
      required: true,
      rules: [min(ref('minAge'))],
    }),
    minAge: number({
      rules: [min(5)],
    }),
  },
});

console.log(JSON.stringify(schema, null, 2));

const result = validate(schema, undefined, {
  age: 10,
  minAge: 11,
});

console.log(result);

function c<const T>(obj: T): T {
  return obj;
}

const f = c({
  foo: 'bar',
  bar: 'foo',
});

// const form = object({
//   fields: {
//     birthDate: dateString({
//       format: 'yyyy',
//       rules: [min('2020')],
//     }),
//     now: dateString(),
//     multiplier: number({}),
//     parentalApproval: number({
//       // required: true,
//       required: matches('birthDate', '^(2020|2021|2022|2023|2024|2025)$'),
//       rules: [
//         custom('isPrime', {
//           multiplier: ref('now'),
//         }),
//       ],
//     }),
//   },
// });

// const foo = object({
//   fields: {
//     name: string(),
//     contactVia: string(),
//     phone: string(),
//   },
// });

// console.log('start...');
// console.time('validate');

// for (let i = 0; i < 30_000; i++) {
//   validate(foo, undefined, {
//     name: 'John',
//     contactVia: 'Foo',
//     phone: '123456789',
//   });
// }
// console.timeEnd('validate');
// console.log('done!');

// // console.log(`is required: ${isRequired(foo, '$.[0].bsn', values)}`);

// console.log('starting validation...');

// console.time('validate');

// // // console.log(isIncluded(foo, '$.[0].birthDate', values));

// const uniqueRule = (
//   { value }: CustomRuleValue<typeof SchemaType.STRING>,
//   { list, property }: { list: unknown; property: string },
// ) => {
//   if (Array.isArray(list) === false) {
//     throw new Error('list must be an array');
//   }

//   let count = 0;
//   for (const item of list) {
//     if (item[property] === value) {
//       count++;
//     }

//     if (count > 1) {
//       return false; // More than one match found; in other words, not unique
//     }
//   }

//   return true;
// };

// const result = validate(
//   foo,
//   [
//     {
//       name: `John ${i}`,
//       bsn: plain('123'),
//       contactVia: 'Foo',
//       birthDate: '2024-01-01',
//       phone: i.toString(), // i.toString(),
//     },
//   ],
//   values,
//   {
//     customRules: {
//       unique: uniqueRule,
//     },
//   },
// );

// console.timeEnd('validate');

// console.log(
//   'validation success:',
//   result.success,
//   JSON.stringify(result, null, 2),
// );

// const objectSchema = object({
//   fields: {
//     contactDetails: object({
//       fields: {
//         name: string({}),
//         // age: number({ rules:  })
//         contactVia: string({}),
//         phone: string({}),
//       },
//     }),
//     address: object({
//       required: eq('contactDetails.contactVia', val('phone')),
//       fields: {
//         name: string({}),
//         contactVia: string({}),
//         phone: string({}),
//       },
//     }),
//   },
// });
// const schema = array({
//   schema: object({
//     fields: {
//       name: string({}),
//       age: number({ required: val(true) }),
//       lastName: string({
//         required: eq('name', val('John')),
//         rules: [
//           conditional({
//             when: gt('age', val(9)),
//             then: min(10),
//           }),
//         ],
//       }),
//     },
//   }),
// });

// console.log(
//   JSON.stringify(
//     validate(schema, [{ name: 'John', lastName: 'Doe', age: 1 }], values),
//     null,
//     2,
//   ),
// );
