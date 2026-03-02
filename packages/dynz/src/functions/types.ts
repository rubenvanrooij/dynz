// import type { Reference } from "../reference";
import type { Reference } from "../reference";
import type { EnumValues } from "../schemas";
import type { ValueType } from "../types";

// ============================================================================
// DYNZ FUNCTIONS OVERVIEW
// ============================================================================
//
// Dynz has three main concepts for building dynamic validation logic:
//
// RULES - Validation constraints attached to schema fields
//    - Define what values are valid for a field
//    - Produce validation errors when violated
//    - Examples: min(), max(), equals(), email(), minLength()
//    - Usage: schema({ rules: [min(v(5)), email()] })
//
// PREDICATES - Boolean expressions (true/false) for conditional logic
//    - Used in `when` clauses of conditional rules
//    - Can be combined with and(), or()
//    - Examples: eq(), gt(), lt(), gte(), lte(), neq()
//    - Usage: conditional({ when: gt(ref('age'), v(18)), then: ... })
//
// TRANSFORMERS - Value calculations/transformations
//    - Compute values for use in rules or predicates
//    - Don't validate themselves - they provide computed values
//    - Examples: sum(), sub(), multiply(), divide(), age(), size()
//    - Usage: min(sum(ref('a'), ref('b')))
//
// HELPERS - Value wrappers
//    - v(value) - Wrap a static/constant value
//    - ref(path) - Reference another field's value
//
// ============================================================================

/**
 * A static (constant) value wrapper.
 *
 * Use {@link v} to create static values for use in rules, predicates, and transformers.
 *
 * @category Helper
 */
export type Static<T extends ValueType = ValueType> = {
  type: "st";
  value: T;
};

/**
 * A parameter value that can be used in rules, predicates, and transformers.
 *
 * This union type represents all possible value types:
 * - {@link Static} - A constant value wrapped with `v()`
 * - {@link Reference} - A reference to another field with `ref()`
 * - {@link Predicate} - A boolean expression
 * - {@link Transformer} - A computed/transformed value
 * - `undefined` - No value
 *
 * @category Core
 */
export type ParamaterValue<T extends ValueType = ValueType> =
  | Static<T>
  | undefined
  | Reference
  | Predicate
  | Transformer;

/**
 * Predicate type identifiers.
 *
 * Predicates are boolean expressions used in conditional logic.
 * They evaluate to true/false and are used with {@link conditional} rules.
 *
 * @category Predicate
 * @see {@link Predicate} - The union type of all predicate shapes
 * @see {@link eq} - Equality predicate builder
 * @see {@link and} - AND combinator predicate builder
 * @see {@link or} - OR combinator predicate builder
 */
export const PredicateType = {
  OR: "or",
  AND: "and",
  EQUALS: "eq",
  NOT_EQUALS: "neq",
  GREATHER_THAN: "gt",
  GREATHER_THAN_OR_EQUAL: "gte",
  LOWER_THAN: "lt",
  LOWER_THAN_OR_EQUAL: "lte",
  MATCHES: "matches",
  IS_IN: "in",
  IS_NOT_IN: "nin",
  CUSTOM: "custom",
} as const;

export type PredicateType = EnumValues<typeof PredicateType>;

export type DefaultPredicateType = Exclude<
  PredicateType,
  typeof PredicateType.OR | typeof PredicateType.AND | typeof PredicateType.MATCHES | typeof PredicateType.CUSTOM
>;

export type DefaultPredicate<
  T extends DefaultPredicateType = DefaultPredicateType,
  TLeft extends ParamaterValue = never,
  TRight extends ParamaterValue = never,
> = {
  type: T;
  left: [TLeft] extends [never] ? ParamaterValue : TLeft;
  right: [TRight] extends [never] ? ParamaterValue : TRight;
};

export type CombinatorPredicateType = typeof PredicateType.OR | typeof PredicateType.AND;

export type CombinatorPredicate<
  T extends CombinatorPredicateType = CombinatorPredicateType,
  TPredicate extends Predicate[] = never,
> = {
  type: T;
  predicates: [TPredicate] extends [never] ? Predicate[] : TPredicate;
};

export type MatchesPredicate<TLeft extends ParamaterValue = never, TRight extends ParamaterValue = never> = {
  type: typeof PredicateType.MATCHES;
  left: [TLeft] extends [never] ? ParamaterValue : TLeft;
  right: [TRight] extends [never] ? ParamaterValue : TRight;
  flags?: string | undefined;
};

export type CustomPredicate<T extends ParamaterValue = never> = {
  type: typeof PredicateType.CUSTOM;
  name: string;
  inputs: [T] extends [never] ? ParamaterValue[] : T;
};

/**
 * A predicate is a boolean expression used in conditional logic.
 *
 * Predicates evaluate to true/false and are used with {@link conditional} rules
 * to apply validation rules based on dynamic conditions.
 *
 * **Important:** Predicates are NOT rules! They don't validate field values directly.
 * They are used in `when` clauses to determine IF a rule should be applied.
 *
 * @category Predicate
 *
 * @example
 * // Predicates in conditional rules
 * conditional({
 *   when: eq(ref('status'), v('active')),  // <-- This is a predicate
 *   then: min(v(10))                        // <-- This is a rule
 * })
 *
 * @example
 * // Combining predicates
 * and(
 *   eq(ref('country'), v('US')),
 *   gt(ref('age'), v(18))
 * )
 *
 * @see {@link eq} - Equality predicate (===)
 * @see {@link gt} - Greater than predicate (>)
 * @see {@link and} - AND combinator
 * @see {@link or} - OR combinator
 * @see {@link conditional} - Rule that uses predicates
 */
export type Predicate = DefaultPredicate | CombinatorPredicate | MatchesPredicate | CustomPredicate;

/**
 * Transformer type identifiers.
 *
 * Transformers compute/transform values for use in rules or predicates.
 * They don't validate directly - they calculate values that can then be validated.
 *
 * @category Transformer
 * @see {@link Transformer} - The union type of all transformer shapes
 * @see {@link sum} - Addition transformer builder
 * @see {@link age} - Age calculation transformer builder
 */
export const TransformerType = {
  SUM: "sum",
  SUB: "sub",
  MULTIPLY: "multiply",
  DIVIDE: "divide",
  SIZE: "size",
  AGE: "age",
} as const;

export type TransformerType = EnumValues<typeof TransformerType>;

export type LeftRightTransformerType =
  | typeof TransformerType.SUM
  | typeof TransformerType.SUB
  | typeof TransformerType.MULTIPLY
  | typeof TransformerType.DIVIDE;

export type LeftRightTransformer<
  T extends LeftRightTransformerType = LeftRightTransformerType,
  TLeft extends ParamaterValue = never,
  TRight extends ParamaterValue = never,
> = {
  type: T;
  // TODO: maybe convert to array?
  left: [TLeft] extends [never] ? ParamaterValue : TLeft;
  right: [TRight] extends [never] ? ParamaterValue : TRight;
};

export type SizeTransformer<TValue extends ParamaterValue = never> = {
  type: typeof TransformerType.SIZE;
  value: [TValue] extends [never] ? ParamaterValue : TValue;
};

export type AgeTransformer<TValue extends ParamaterValue = never> = {
  type: typeof TransformerType.AGE;
  value: [TValue] extends [never] ? ParamaterValue : TValue;
};

/**
 * A transformer computes/transforms values for use in rules or predicates.
 *
 * Transformers don't validate directly - they calculate values that can then
 * be used as inputs to validation rules or predicates.
 *
 * **Important:** Transformers are NOT rules! They don't produce validation errors.
 * They compute values that are then validated by rules.
 *
 * @category Transformer
 *
 * @example
 * // Transformer as input to a rule
 * number({
 *   rules: [min(sum(ref('margin'), ref('commission')))]
 *   //          ^^^--- sum() is the transformer
 *   //      ^^^------- min() is the rule
 * })
 *
 * @example
 * // Transformer in a predicate
 * conditional({
 *   when: lte(age(ref('birthDate')), v(18)),
 *   //        ^^^--- age() is the transformer
 *   //   ^^^-------- lte() is the predicate
 *   then: equals(v(true))
 * })
 *
 * @see {@link sum} - Addition transformer
 * @see {@link sub} - Subtraction transformer
 * @see {@link age} - Age calculation transformer
 * @see {@link size} - Size/length transformer
 */
export type Transformer = LeftRightTransformer | SizeTransformer | AgeTransformer;

/**
 * A function is either a Transformer or a Predicate.
 *
 * @category Core
 * @see {@link Transformer} - Value computation functions
 * @see {@link Predicate} - Boolean expression functions
 */
export type Func = Transformer | Predicate;
