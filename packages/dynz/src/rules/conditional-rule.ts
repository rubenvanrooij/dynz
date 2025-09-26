import type { Condition } from "../conditions";
import type { BaseRule } from "../types";

export type ConditionalRule<TRule extends BaseRule, TCondition> = BaseRule & {
  type: "conditional";
  when: [TCondition] extends [never] ? Condition : TCondition;
  then: [TRule] extends [never] ? BaseRule : TRule;
};

// TODO: create BaseCondition type
export function conditional<T extends BaseRule, A extends Condition>({
  when,
  then,
}: {
  when: A;
  then: T;
}): ConditionalRule<T, A> {
  return { type: "conditional", when, then };
}
