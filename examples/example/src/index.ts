import * as d from "dynz";

// const foo = object({
//   fields: {
//     password: string(),
//     confirmPassword: string({
//       rules: [equals(ref('password'))]
//     })
//   }
// })

// const schema = object({
//   fields: {
//     name: string({ rules: [min(1)] }),
//     age: number({ included: false }),
//     tags: array({ schema: string() }),
//   },
// });

// // Type-safe validation results
// const result = validate(schema, undefined, {
//   name: "Joshns",
//   age: 31,
//   tags: ["dynz"],
// });
// console.log(result);
// if (result.success) {
//   // result.values is properly typed as UserData
//   console.log(result.values); // ✅ Type-safe access
// }

const schema = d.object({
  fields: {
    accountType: d.options({
      options: ["personal", "business"],
    }),

    minLength: d.number(),

    // Only included if accountType is 'business'
    companyName: d.string({
      rules: [d.minLength(d.ref("minLength"))],
      required: d.matches("email", "@gmail.com$"),
      included: d.eq("accountType", "business"),
    }),

    email: d.string({
      rules: [
        d.email(),
        d.conditional({
          // Different validation rules based on account type
          when: d.eq("accountType", "business"),
          then: d.regex("@company.com$", "Business accounts must use company email"),
        }),
      ],
    }),
  },
});

const schemaTwo = d.object({
  fields: {
    birthDates: d.array({
      schema: d.date()
    }),
    otherFields: d.object({
      fields: {
         deathDate: d.date({
          rules: [d.after(d.ref('$.birthDate.[2]'))]
        })
      }
    })
  }
})

console.log(d.validate(schemaTwo, undefined, {
  birthDates: [],
  otherFields: {
    deathDate: new Date()
  }
}))

// console.log(JSON.stringify(schema, undefined, 2));

// // Validate data
const result = d.validate(schema, undefined, {
  accountType: "business",
  minLength: 10,
  companyName: "test",
  email: "foo@company.com",
});

console.log(result);
/**
 * new interface?
object({
  accountType: string()
    .oneOf(['personal', 'business']),
  companyName: string()
    .min(2)
    .requiredIf(eq('accountType', 'business'))
  email: string()
    .email()
    .conditional({
      when: eq('accountType', 'business'),
      then: regex('@company\.com$', "Business accounts must use company email")
    })
})
*/

// const createUserSchema = (user: { role: 'user' | 'admin' }) => {
//   return object({
//     fields: {
//       username: string({
//         mutable: user.role === 'admin',
//       }),
//       bsn: string({
//         rules: [regex('^\d{8,9}$', 'bsn')],
//         private: true,
//       })
//     }
//   })
// }

// const schema = createUserSchema({ role: 'admin' })

// console.log(JSON.stringify(schema, undefined, 2))

// // Validate data
// const result = validate(schema, {
//   username: 'foos',
//   bsn: '123'
// }, {
//   username: 'foo',
//   bsn: mask('3213'),
// })

// if (result.success) {
//   console.log("Valid data:", result.values)
// } else {
//   console.log("Validation errors:", result.errors)
// }

// function c<const T>(obj: T): T {
//   return obj;
// }

// const f = c({
//   foo: 'bar',
//   bar: 'foo',
// });

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
