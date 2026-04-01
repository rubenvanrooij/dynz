// import type { ParamaterValue } from "../types";

// export const customFunctionType = "custom";

// export type CustomFunction<T extends ParamaterValue[] = never> = {
//   type: typeof customFunctionType;
//   name: string;
//   inputs: [T] extends [never] ? ParamaterValue[] : T;
// };

// export function custom<const T extends ParamaterValue[]>(name: string, ...inputs: T): CustomFunction<T> {
//   return {
//     type: customFunctionType,
//     name,
//     inputs,
//   };
// }
