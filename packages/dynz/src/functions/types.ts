// import type { Reference } from "../reference";
import type { Reference } from "../reference";
import type { ValueType } from "../types";
import type { Predicate } from "./predicate-types";
import type { Transformer } from "./transformer-types";

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
 * A function is either a Transformer or a Predicate.
 *
 * @category Core
 * @see {@link Transformer} - Value computation functions
 * @see {@link Predicate} - Boolean expression functions
 */
export type Func = Transformer | Predicate;
