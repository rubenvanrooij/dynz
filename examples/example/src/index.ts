import * as d from "dynz";
import { expect } from "vitest";
import { expression } from "./../../../packages/dynz/src/schemas/expression/builder";
import { runRegistrationForm } from "./registration-form";

// runRegistrationForm()

const ADDONS_PRICES = {
  legalAid: 10,
  damageToPassengers: 5,
  roadsideAssistance: 3,
};

const PRODUCT_PRICES = {
  A: 20,
  B: 25,
  C: 30,
};

const PAYMENT_INTERVAL_DISCOUNT = {
  YEARLY: 0.9, // 10%
  MONTHLY: 1.0, // 0%
};

const supportSchema = d.object({
  fields: {
    topic: d.options({
      options: ["billing", "technical", "other"],
    }),
    orderId: d.string({
      included: d.eq(d.ref("topic"), d.v("billing")),
    }),
    description: d.string({
      included: d.eq(d.ref("topic"), d.v("other")),
    }),
    message: d.string(),
  },
});

const schema = d.obj({
  foo: d.str(),
  bar: d.str()
})

console.log(d.validate(schema, undefined, {}))

// const pcConfiguratorSchema = d.object({
//   fields: {
//     cores: d.options({
//       options: [8, 16, 32, 64],
//     }),
//     ramGb: d.options({
//       options: [16, 32, 64, 128],
//     }),
//     gpuCount: d.number({
//       // rules: [d.min(d.v(1)), d.max(d.v(1))],
//     }),
//     sliMode: d.options({
//       options: ["nvlink", "disabled"],
//       included: d.gte(d.ref("gpuCount"), d.v(2)),
//     }),
//     storageCount: d.number({
//       // rules: [d.min(d.v(1)), d.max(d.v(8))],
//     }),
//     storageRaidLevel: d.options({
//       options: [
//         "raid0",
//         "raid1",
//         {
//           enabled: d.gte(d.ref("storageCount"), d.v(3)),
//           value: "raid5",
//         },
//       ],
//       included: d.gte(d.ref("storageCount"), d.v(2)),
//     }),
//     coolingType: d.options({
//       options: ["air", "liquid-240", "liquid-360"],
//       included: d.gte(d.multiply(d.ref("cores"), d.ref("gpuCount")), d.v(32)),
//     }),
//     totalTdp: d.expression({
//       value: d.multiply(d.ref("cores"), d.v(8)),
//     }),
//   },
// });

// const obj = d.object({
//   fields: {
//     product: d.options({
//       options: ["A", "B", "C"],
//     }),
//     paymentInterval: d.options({
//       options: ["YEARLY", "MONTHLY"],
//     }),
//     addons: d.object({
//       fields: {
//         legalAid: d.boolean({
//           included: d.gt(
//             d.lookup({
//               value: d.ref("$.product"),
//               lookup: d.val(PRODUCT_PRICES),
//             }),
//             d.val(2)
//           ),
//         }),
//         damageToPassengers: d.boolean(),
//         roadsideAssistance: d.boolean(),
//       },
//     }),
//     price: d.expression({
//       value: d.multiply(
//         d.sum(
//           d.lookup({
//             value: d.ref("$.product"),
//             lookup: d.val(PRODUCT_PRICES),
//           }),
//           d.multiply(d.size(d.ref("$.addons.legalAid")), d.val(ADDONS_PRICES.legalAid)),
//           d.multiply(d.size(d.ref("$.addons.damageToPassengers")), d.val(ADDONS_PRICES.damageToPassengers)),
//           d.multiply(d.size(d.ref("$.addons.roadsideAssistance")), d.val(ADDONS_PRICES.roadsideAssistance))
//         ),
//         d.lookup({
//           value: d.ref("$.paymentInterval"),
//           lookup: d.val(PAYMENT_INTERVAL_DISCOUNT),
//         })
//       ),
//     }),
//   },
// });
// console.log(JSON.stringify(obj));

// console.log(
//   d.validate(obj, undefined, {
//     product: "A",
//     paymentInterval: "YEARLY",
//     addons: {
//       legalAid: false,
//       damageToPassengers: true,
//       roadsideAssistance: true,
//     },
//   })
// );

// const car = d.object({
//   fields: {
//     licensePlate: d.string({
//       rules: [d.custom("validLicensePlate")],
//     }),
//     car: d.string({}),
//     foo: d.string({}),
//   },
// });

// d.validate(
//   car,
//   undefined,
//   {
//     licensePlate: "K-157-NJ",
//   },
//   {
//     customRules: {
//       validLicensePlate: (value) => {
//         return new Promise((r) => {
//           setTimeout(() => {
//             if (
//               typeof value.value === "string" &&
//               value.value.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === "k157nj"
//             ) {
//               return r(true);
//             } else {
//               return r({
//                 success: false,
//               });
//             }
//           }, 100);
//         });
//       },
//     },
//   }
// ).then((val) => {
//   console.log(val);
// });

// console.log(
//   d.validate(car, undefined, {
//     licensePlate: '3'
//   }, {
//     customRules: {
//       'validLicensePlate': (value) => {
//         return new Promise((r) => {
//           setTimeout(() => {
//             r(true)
//           }, 10000)
//         })
//       }
//     }
//   })
// );

// console.log('isInclluded: ', d.isIncluded(obj, '$.settings.wantCoffee', {
//   tired: true
// }))

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

// const MIN_ANGLE = 4;
// const MAX_ANGLE = 10;

// const MIN_FUNCTION = d.ceil(d.sum(d.ref("frontHeight"), d.multiply(d.ref("depth"), d.tan(d.v(MIN_ANGLE)))));
// const MAX_FUNCTION = d.ceil(d.sum(d.ref("frontHeight"), d.multiply(d.ref("depth"), d.tan(d.v(MAX_ANGLE)))));

// const VERANDA_SCHEMA = d.object({
//   fields: {
//     depth: d.number(),
//     frontHeight: d.number(),
//     backHeight: d.number({
//       rules: [d.min(MIN_FUNCTION), d.max(MAX_FUNCTION)],
//     }),
//   },
// });

// const a = d.getNested("depth", VERANDA_SCHEMA, {});

// console.log(a.value);

// // resolve min value of backHeight
// console.log("---ST--");
// console.log(
//   d.resolve(MIN_FUNCTION, "$", {
//     schema: VERANDA_SCHEMA,
//     values: {
//       depth: 2500,
//       frontHeight: 2000,
//     },
//   })
// );
// console.log("--END---");

// console.log(
//   d.validate(VERANDA_SCHEMA, undefined, {
//     depth: 2500,
//     frontHeight: 2000,
//     backHeight: 2100,
//   })
// );

// const priceExample = d.object({
//   fields: {
//     price: d.number({
//       rules: [d.min(d.sum(d.ref("margin"), d.ref("commission")))],
//     }),
//     margin: d.number({
//       // rules: [d.age(d.v(3))],
//     }),
//     commission: d.number({
//       rules: [d.min(d.v(0))],
//     }),
//   },
// });

// /** SUCCESS */
// console.log(
//   d.validate(priceExample, undefined, {
//     price: 3123,
//     margin: 15,
//     commission: 5,
//   })
// );

// /** FAILS */
// console.log(
//   d.validate(priceExample, undefined, {
//     price: 3123,
//     margin: 15,
//     commission: 5,
//   })
// );

// const Countries = {
//   Netherlands: "netherlands",
//   USA: "usa",
// } as const;

// export const MinorAges = {
//   [Countries.Netherlands]: 18,
//   [Countries.USA]: 21,
// };

// const minAge = <T extends string, A extends d.ParamaterValue>(ref: T, min: A) => d.lte(d.age(d.ref(ref)), min);

// const parentalApprovalExample = d.object({
//   fields: {
//     country: d.enum({
//       enum: Countries,
//     }),
//     birthDate: d.date(),
//     parentalApproval: d.boolean({
//       rules: [
//         d.conditional(
//           ...Object.entries(MinorAges).map(([country, age]) => ({
//             when: d.and(d.eq(d.ref("country"), d.v(country)), minAge("birthDate", d.v(age))),
//             then: d.equals(d.v(true), `Parental approval is required for users under ${age} from ${country}`),
//           }))
//         ),
//       ],
//     }),
//   },
// });

// console.log(JSON.stringify(parentalApprovalExample));

// console.log(
//   d.validate(parentalApprovalExample, undefined, {
//     country: Countries.USA,
//     birthDate: new Date("2007-01-22"),
//     parentalApproval: false,
//   })
// );

// const UserRoles = {
//   ADMIN: "admin",
//   MAINTAINER: "maintainer",
// } as const;

// const z_user = z.object({
//   role: z.array(z.nativeEnum(UserRoles)),
//   email: z.string().email(),
//   name: z.string().min(2).max(100),
//   age: z.number().min(0).max(150).optional(),
//   isActive: z.boolean(),
// });

// const d_user = d.object({
//   fields: {
//     role: d.array({
//       schema: d.enum({
//         enum: UserRoles,
//       }),
//     }),
//     aa: d.options({
//       options: ["fo", "bar"],
//     }),
//     name: d.string({
//       rules: [d.minLength(2), d.maxLength(100)],
//     }),
//     email: d.string({
//       rules: [d.email()],
//     }),
//     age: d.number({
//       rules: [d.min(0), d.max(150)],
//       required: false,
//     }),
//     isActive: d.boolean(),
//   },
// });

// const DATA = {
//   role: ["admin", "maintainer"],
//   name: "Jan",
//   email: "jan@jan.nl",
//   age: 23,
//   isActive: false,
// };

// console.time("perf_z");

// for (let i = 0; i < 1_000_000; i++) {
//   z_user.safeParse(DATA);
// }

// console.timeEnd("perf_z");

// console.time("perf_d");

// for (let i = 0; i < 1_000_000; i++) {
//   d.validate(d_user, undefined, DATA);
// }

// console.timeEnd("perf_d");

// const schema = d.object({
//   fields: {
//     accountType: d.options({
//       options: ["personal", "business"],
//     }),

//     minLength: d.number(),

//     // Only included if accountType is 'business'
//     companyName: d.string({
//       rules: [d.minLength(d.ref("minLength"))],
//       required: d.matches("email", "@gmail.com$"),
//       included: d.eq("accountType", "business"),
//     }),

//     email: d.string({
//       rules: [
//         d.email(),
//         d.conditional({
//           // Different validation rules based on account type
//           when: d.eq("accountType", "business"),
//           then: d.regex("@company.com$", "Business accounts must use company email"),
//         }),
//       ],
//     }),
//   },
// });

// const schemaTwo = d.object({
//   fields: {
//     birthDates: d.array({
//       schema: d.date(),
//     }),
//     otherFields: d.object({
//       fields: {
//         deathDate: d.date({
//           rules: [d.after(d.ref("$.birthDate.[2]"))],
//         }),
//       },
//     }),
//   },
// });

// console.log(
//   d.validate(schemaTwo, undefined, {
//     birthDates: [],
//     otherFields: {
//       deathDate: new Date(),
//     },
//   })
// );

// // console.log(JSON.stringify(schema, undefined, 2));

// // // Validate data
// const result = d.validate(schema, undefined, {
//   accountType: "business",
//   minLength: 10,
//   companyName: "test",
//   email: "foo@company.com",
// });

// console.log(result);
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
      then: regex('@company.com$', "Business accounts must use company email")
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
//         rules: [regex('^d{8,9}$', 'bsn')],
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

// // console.log(`is required: $isRequired(foo, '$.[0].bsn', values)`);

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
//       name: `John $i`,
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
