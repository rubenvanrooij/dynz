import type { ValueType } from "../../types";
import { isDate } from "../../validate/validate-type";
import type { ParamaterValue } from "../types";

export const ageTransformerType = "age";

export type AgeTransformer<TValue extends ParamaterValue = never> = {
  type: typeof ageTransformerType;
  value: [TValue] extends [never] ? ParamaterValue : TValue;
};

/**
 * Creates an age transformer that calculates the age in years from a date.
 *
 * Transformers compute values that can be used as inputs to rules or predicates.
 * The age transformer calculates how many complete years have passed since
 * the given date (typically a birth date).
 *
 * @category Transformer
 * @param value - The date value to calculate age from (reference or static date)
 * @returns A Transformer that computes the age in years
 *
 * @example
 * // Check if user is at least 18 years old
 * gte(age(ref('birthDate')), v(18))
 *
 * @example
 * // Conditional validation based on age
 * conditional({
 *   when: lte(age(ref('birthDate')), v(18)),
 *   then: equals(v(true), 'Parental approval required for minors')
 * })
 *
 * @example
 * // Different age requirements by country
 * conditional(
 *   { when: and(eq(ref('country'), v('US')), lte(age(ref('birthDate')), v(21))), then: equals(v(true)) },
 *   { when: and(eq(ref('country'), v('EU')), lte(age(ref('birthDate')), v(18))), then: equals(v(true)) }
 * )
 *
 * @see {@link minDate} - Rule for minimum date validation
 * @see {@link maxDate} - Rule for maximum date validation
 */
export function age<const T extends ParamaterValue>(value: T): AgeTransformer<T> {
  return {
    type: ageTransformerType,
    value,
  };
}

function getAge(birthDate: Date) {
  var today = new Date();
  var age = today.getFullYear() - birthDate.getFullYear();
  var m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function ageTransformer(value: ValueType | undefined) {
  if (isDate(value)) {
    return getAge(value);
  }

  return NaN;
}
