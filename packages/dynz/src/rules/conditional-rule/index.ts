import type { Condition } from "../../conditions";
import type { Predicate } from "../../functions";
import type { BaseRule } from "../../types";

export type ConditionalRule<TRule extends BaseRule, TPredicate extends Predicate> = BaseRule & {
  type: "conditional";
  when: [TPredicate] extends [never] ? Predicate : TPredicate;
  then: [TRule] extends [never] ? BaseRule : TRule;
};

// TODO: create BaseCondition type
export function conditional<T extends BaseRule, A extends Predicate>({
  when,
  then,
}: {
  when: A;
  then: T;
}): ConditionalRule<T, A> {
  return { type: "conditional", when, then };
}
