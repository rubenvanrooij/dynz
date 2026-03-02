import type { Reference } from "../reference";
import type { ValueType } from "../types";
import {
  type CombinatorPredicate,
  type DefaultPredicate,
  type LeftRightTransformer,
  type ParamaterValue,
  type Predicate,
  PredicateType,
  type Static,
  TransformerType,
} from "./types";

/**
 * Creates a static value wrapper for use in rules, predicates, and transformers.
 *
 * Static values are constant values that don't change during validation.
 * Use this to wrap literal values when building expressions.
 *
 * @category Helper
 * @param val - The static value to wrap (string, number, boolean, etc.)
 * @returns A Static value wrapper
 *
 * @example
 * // Use in a rule
 * number({ rules: [min(v(5))] })
 *
 * @example
 * // Use in a predicate
 * eq(ref('status'), v('active'))
 *
 * @example
 * // Use in a transformer
 * sum(ref('price'), v(10))
 *
 * @see {@link ref} - For referencing other field values
 * @see {@link Predicate} - Boolean expressions using static values
 * @see {@link Transformer} - Value calculations using static values
 */
export function v<const T extends ValueType>(val: T): Static<T> {
  return {
    type: "st",
    value: val,
  };
}

/**
 * Creates a reference to another field's value (alias for {@link ref}).
 *
 * References allow you to dynamically access values from other fields
 * in the schema during validation. The path is relative to the schema root.
 *
 * @category Helper
 * @param val - The dot-notation path to the referenced field
 * @returns A Reference to the field
 *
 * @example
 * // Reference a sibling field
 * r('otherField')
 *
 * @example
 * // Reference a nested field
 * r('address.city')
 *
 * @see {@link ref} - The full version of this function
 * @see {@link v} - For static/constant values
 */
export function r<const T extends string>(val: T): Reference<T> {
  return {
    type: "_dref",
    path: val,
  };
}

/**
 * Creates an AND predicate that returns true only if ALL predicates are true.
 *
 * Predicates are boolean expressions used in conditional logic. They evaluate
 * to true/false and are used with {@link conditional} rules to apply validation
 * rules based on dynamic conditions.
 *
 * @category Predicate
 * @param predicates - One or more predicates to combine with AND logic
 * @returns A CombinatorPredicate that is true when all predicates are true
 *
 * @example
 * // Both conditions must be true
 * and(
 *   eq(ref('status'), v('active')),
 *   gt(ref('age'), v(18))
 * )
 *
 * @example
 * // Use in conditional rule
 * conditional({
 *   when: and(eq(ref('country'), v('US')), gt(ref('age'), v(21))),
 *   then: equals(v(true))
 * })
 *
 * @see {@link or} - For OR logic (any predicate true)
 * @see {@link conditional} - Rule that applies based on predicates
 * @see {@link eq} - Equality predicate
 * @see {@link gt} - Greater than predicate
 */
export function and<const T extends Predicate[]>(...predicates: T): CombinatorPredicate<typeof PredicateType.AND, T> {
  return {
    type: PredicateType.AND,
    predicates,
  };
}

/**
 * Creates an OR predicate that returns true if ANY predicate is true.
 *
 * Predicates are boolean expressions used in conditional logic. They evaluate
 * to true/false and are used with {@link conditional} rules to apply validation
 * rules based on dynamic conditions.
 *
 * @category Predicate
 * @param predicates - One or more predicates to combine with OR logic
 * @returns A CombinatorPredicate that is true when any predicate is true
 *
 * @example
 * // Either condition can be true
 * or(
 *   eq(ref('role'), v('admin')),
 *   eq(ref('role'), v('superuser'))
 * )
 *
 * @example
 * // Use in conditional rule
 * conditional({
 *   when: or(eq(ref('type'), v('premium')), gt(ref('balance'), v(1000))),
 *   then: equals(v(true))
 * })
 *
 * @see {@link and} - For AND logic (all predicates true)
 * @see {@link conditional} - Rule that applies based on predicates
 */
export function or<const T extends Predicate[]>(...predicates: T): CombinatorPredicate<typeof PredicateType.OR, T> {
  return {
    type: PredicateType.OR,
    predicates,
  };
}

/**
 * Creates a "greater than" predicate (left > right).
 *
 * Predicates are boolean expressions used in conditional logic. They evaluate
 * to true/false and are typically used with {@link conditional} rules or combined
 * with {@link and}/{@link or}.
 *
 * @category Predicate
 * @param left - The left operand (value, reference, or transformer)
 * @param right - The right operand (value, reference, or transformer)
 * @returns A Predicate that is true when left > right
 *
 * @example
 * // Check if age is greater than 18
 * gt(ref('age'), v(18))
 *
 * @example
 * // Compare two field values
 * gt(ref('price'), ref('cost'))
 *
 * @example
 * // Use with transformer
 * gt(age(ref('birthDate')), v(21))
 *
 * @see {@link gte} - Greater than or equal (>=)
 * @see {@link lt} - Less than (<)
 * @see {@link lte} - Less than or equal (<=)
 * @see {@link min} - Rule for minimum value validation
 */
export function gt<const T extends ParamaterValue, const V extends ParamaterValue>(
  left: T,
  right: V
): DefaultPredicate<typeof PredicateType.GREATHER_THAN, T, V> {
  return {
    type: PredicateType.GREATHER_THAN,
    left,
    right,
  };
}

/**
 * Creates a "greater than or equal" predicate (left >= right).
 *
 * Predicates are boolean expressions used in conditional logic. They evaluate
 * to true/false and are typically used with {@link conditional} rules or combined
 * with {@link and}/{@link or}.
 *
 * @category Predicate
 * @param left - The left operand (value, reference, or transformer)
 * @param right - The right operand (value, reference, or transformer)
 * @returns A Predicate that is true when left >= right
 *
 * @example
 * // Check if age is at least 18
 * gte(ref('age'), v(18))
 *
 * @example
 * // Check if price covers cost
 * gte(ref('price'), ref('cost'))
 *
 * @see {@link gt} - Greater than (>)
 * @see {@link lt} - Less than (<)
 * @see {@link lte} - Less than or equal (<=)
 * @see {@link min} - Rule for minimum value validation
 */
export function gte<const T extends ParamaterValue, const V extends ParamaterValue>(
  left: T,
  right: V
): DefaultPredicate<typeof PredicateType.GREATHER_THAN_OR_EQUAL, T, V> {
  return {
    type: PredicateType.GREATHER_THAN_OR_EQUAL,
    left,
    right,
  };
}

/**
 * Creates a "less than" predicate (left < right).
 *
 * Predicates are boolean expressions used in conditional logic. They evaluate
 * to true/false and are typically used with {@link conditional} rules or combined
 * with {@link and}/{@link or}.
 *
 * @category Predicate
 * @param left - The left operand (value, reference, or transformer)
 * @param right - The right operand (value, reference, or transformer)
 * @returns A Predicate that is true when left < right
 *
 * @example
 * // Check if quantity is under limit
 * lt(ref('quantity'), v(100))
 *
 * @example
 * // Compare two field values
 * lt(ref('startDate'), ref('endDate'))
 *
 * @see {@link lte} - Less than or equal (<=)
 * @see {@link gt} - Greater than (>)
 * @see {@link gte} - Greater than or equal (>=)
 * @see {@link max} - Rule for maximum value validation
 */
export function lt<const T extends ParamaterValue, const V extends ParamaterValue>(
  left: T,
  right: V
): DefaultPredicate<typeof PredicateType.LOWER_THAN, T, V> {
  return {
    type: PredicateType.LOWER_THAN,
    left,
    right,
  };
}

/**
 * Creates a "less than or equal" predicate (left <= right).
 *
 * Predicates are boolean expressions used in conditional logic. They evaluate
 * to true/false and are typically used with {@link conditional} rules or combined
 * with {@link and}/{@link or}.
 *
 * @category Predicate
 * @param left - The left operand (value, reference, or transformer)
 * @param right - The right operand (value, reference, or transformer)
 * @returns A Predicate that is true when left <= right
 *
 * @example
 * // Check if age is at most the minor age
 * lte(age(ref('birthDate')), v(18))
 *
 * @example
 * // Ensure discount doesn't exceed price
 * lte(ref('discount'), ref('price'))
 *
 * @see {@link lt} - Less than (<)
 * @see {@link gt} - Greater than (>)
 * @see {@link gte} - Greater than or equal (>=)
 * @see {@link max} - Rule for maximum value validation
 */
export function lte<const T extends ParamaterValue, const V extends ParamaterValue>(
  left: T,
  right: V
): DefaultPredicate<typeof PredicateType.LOWER_THAN_OR_EQUAL, T, V> {
  return {
    type: PredicateType.LOWER_THAN_OR_EQUAL,
    left,
    right,
  };
}

/**
 * Creates an "equals" predicate (left === right).
 *
 * Predicates are boolean expressions used in conditional logic. They evaluate
 * to true/false and are typically used with {@link conditional} rules or combined
 * with {@link and}/{@link or}.
 *
 * **Note:** This is different from the {@link equals} rule! This predicate is for
 * conditional logic, while `equals()` is a validation rule.
 *
 * @category Predicate
 * @param left - The left operand (value, reference, or transformer)
 * @param right - The right operand (value, reference, or transformer)
 * @returns A Predicate that is true when left === right
 *
 * @example
 * // Check if status equals 'active'
 * eq(ref('status'), v('active'))
 *
 * @example
 * // Check if two fields are equal
 * eq(ref('password'), ref('confirmPassword'))
 *
 * @example
 * // Use in conditional rule
 * conditional({
 *   when: eq(ref('country'), v('US')),
 *   then: minLength(v(5))  // US zip codes are 5 digits
 * })
 *
 * @see {@link neq} - Not equals predicate
 * @see {@link equals} - Validation rule (not a predicate!)
 */
export function eq<const T extends ParamaterValue, const V extends ParamaterValue>(
  left: T,
  right: V
): DefaultPredicate<typeof PredicateType.EQUALS, T, V> {
  return {
    type: PredicateType.EQUALS,
    left,
    right,
  };
}

/**
 * Creates a "not equals" predicate (left !== right).
 *
 * Predicates are boolean expressions used in conditional logic. They evaluate
 * to true/false and are typically used with {@link conditional} rules or combined
 * with {@link and}/{@link or}.
 *
 * @category Predicate
 * @param left - The left operand (value, reference, or transformer)
 * @param right - The right operand (value, reference, or transformer)
 * @returns A Predicate that is true when left !== right
 *
 * @example
 * // Check if status is not 'deleted'
 * neq(ref('status'), v('deleted'))
 *
 * @example
 * // Ensure two fields are different
 * neq(ref('newPassword'), ref('oldPassword'))
 *
 * @see {@link eq} - Equals predicate
 */
export function neq<const T extends ParamaterValue, const V extends ParamaterValue>(
  left: T,
  right: V
): DefaultPredicate<typeof PredicateType.NOT_EQUALS, T, V> {
  return {
    type: PredicateType.NOT_EQUALS,
    left,
    right,
  };
}

// ============================================================================
// TRANSFORMERS
// ============================================================================
//
// Transformers compute/transform values for use in rules or predicates.
// They don't validate - they calculate values that can then be validated.
//
// Example: min(sum(ref('a'), ref('b'))) - sum is the transformer, min is the rule
// ============================================================================

/**
 * Creates a subtraction transformer (left - right).
 *
 * Transformers compute values that can be used as inputs to rules or predicates.
 * They perform calculations but don't validate - use them to derive values
 * that are then validated by rules.
 *
 * @category Transformer
 * @param left - The value to subtract from (minuend)
 * @param right - The value to subtract (subtrahend)
 * @returns A Transformer that computes left - right
 *
 * @example
 * // Validate that profit (price - cost) is at least 10
 * number({
 *   rules: [min(sub(ref('price'), ref('cost')))]
 * })
 *
 * @example
 * // Use in a predicate
 * gt(sub(ref('total'), ref('discount')), v(0))
 *
 * @see {@link sum} - Addition transformer
 * @see {@link multiply} - Multiplication transformer
 * @see {@link divide} - Division transformer
 */
export function sub<const T extends ParamaterValue, const V extends ParamaterValue>(
  left: T,
  right: V
): LeftRightTransformer<typeof TransformerType.SUB, T, V> {
  return {
    type: TransformerType.SUB,
    left,
    right,
  };
}

/**
 * Creates an addition transformer (left + right).
 *
 * Transformers compute values that can be used as inputs to rules or predicates.
 * They perform calculations but don't validate - use them to derive values
 * that are then validated by rules.
 *
 * @category Transformer
 * @param left - The first value to add
 * @param right - The second value to add
 * @returns A Transformer that computes left + right
 *
 * @example
 * // Price must be at least margin + commission
 * number({
 *   rules: [min(sum(ref('margin'), ref('commission')))]
 * })
 *
 * @example
 * // Nested transformers
 * sum(sum(ref('a'), ref('b')), ref('c'))  // a + b + c
 *
 * @see {@link sub} - Subtraction transformer
 * @see {@link multiply} - Multiplication transformer
 * @see {@link divide} - Division transformer
 */
export function sum<const T extends ParamaterValue, const V extends ParamaterValue>(
  left: T,
  right: V
): LeftRightTransformer<typeof TransformerType.SUM, T, V> {
  return {
    type: TransformerType.SUM,
    left,
    right,
  };
}

/**
 * Creates a multiplication transformer (left * right).
 *
 * Transformers compute values that can be used as inputs to rules or predicates.
 * They perform calculations but don't validate - use them to derive values
 * that are then validated by rules.
 *
 * @category Transformer
 * @param left - The first factor
 * @param right - The second factor
 * @returns A Transformer that computes left * right
 *
 * @example
 * // Total must equal quantity * unitPrice
 * number({
 *   rules: [equals(multiply(ref('quantity'), ref('unitPrice')))]
 * })
 *
 * @example
 * // Apply percentage (e.g., 10% tax)
 * multiply(ref('subtotal'), v(0.1))
 *
 * @see {@link divide} - Division transformer
 * @see {@link sum} - Addition transformer
 * @see {@link sub} - Subtraction transformer
 */
export function multiply<const T extends ParamaterValue, const V extends ParamaterValue>(
  left: T,
  right: V
): LeftRightTransformer<typeof TransformerType.MULTIPLY, T, V> {
  return {
    type: TransformerType.MULTIPLY,
    left,
    right,
  };
}

/**
 * Creates a division transformer (left / right).
 *
 * Transformers compute values that can be used as inputs to rules or predicates.
 * They perform calculations but don't validate - use them to derive values
 * that are then validated by rules.
 *
 * @category Transformer
 * @param left - The dividend (number to be divided)
 * @param right - The divisor (number to divide by)
 * @returns A Transformer that computes left / right
 *
 * @example
 * // Check if average score is above 70
 * gt(divide(ref('totalScore'), ref('numTests')), v(70))
 *
 * @example
 * // Calculate unit price
 * divide(ref('totalPrice'), ref('quantity'))
 *
 * @see {@link multiply} - Multiplication transformer
 * @see {@link sum} - Addition transformer
 * @see {@link sub} - Subtraction transformer
 */
export function divide<const T extends ParamaterValue, const V extends ParamaterValue>(
  left: T,
  right: V
): LeftRightTransformer<typeof TransformerType.DIVIDE, T, V> {
  return {
    type: TransformerType.DIVIDE,
    left,
    right,
  };
}

/**
 * Creates a size transformer that returns the length/size of a value.
 *
 * Transformers compute values that can be used as inputs to rules or predicates.
 * The size transformer returns:
 * - For strings: the character count
 * - For arrays: the number of elements
 * - For objects: the number of keys
 *
 * @category Transformer
 * @param value - The value to get the size of (reference, static value, etc.)
 * @returns A Transformer that computes the size of the value
 *
 * @example
 * // Check if tags array has at least 3 items
 * gte(size(ref('tags')), v(3))
 *
 * @example
 * // Use in a predicate for conditional logic
 * conditional({
 *   when: gt(size(ref('items')), v(10)),
 *   then: equals(v(true), 'Bulk order confirmation required')
 * })
 *
 * @see {@link minLength} - Rule for minimum length validation
 * @see {@link maxLength} - Rule for maximum length validation
 */
export function size<const T extends ParamaterValue>(value: T): { type: typeof TransformerType.SIZE; value: T } {
  return {
    type: TransformerType.SIZE,
    value,
  };
}

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
export function age<const T extends ParamaterValue>(value: T): { type: typeof TransformerType.AGE; value: T } {
  return {
    type: TransformerType.AGE,
    value,
  };
}
