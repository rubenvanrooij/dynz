import { type Predicate, resolvePredicate } from "dynz";
import { type ComputedRef, type MaybeRefOrGetter, computed, toValue } from "vue";
import { useDynzFormContext } from "../context";

/**
 * Evaluates any dynz predicate against the live form values.
 *
 * ```ts
 * const isEnterprise = usePredicate(eq(ref("plan"), "enterprise"));
 * ```
 */
export function usePredicate(predicate: MaybeRefOrGetter<Predicate>): ComputedRef<boolean | undefined> {
  const context = useDynzFormContext();

  return computed(() =>
    resolvePredicate(toValue(predicate), "$", {
      schema: context.schema,
      values: context.getValues(),
    })
  );
}
