import type { ParamaterValue } from "../types";

export const customPredicateType = "custom";

export type CustomPredicate<T extends ParamaterValue[] = never> = {
  type: typeof customPredicateType;
  name: string;
  inputs: [T] extends [never] ? ParamaterValue[] : T;
};

export function custom<const T extends ParamaterValue[]>(name: string, inputs: T): CustomPredicate<T> {
  return {
    type: customPredicateType,
    name,
    inputs,
  };
}
