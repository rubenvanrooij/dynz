import type { Predicate } from "dynz";
import { type PropType, defineComponent } from "vue";
import { usePredicate } from "../composables";

/**
 * Renders its default slot only while the predicate holds.
 *
 * ```vue
 * <When :cond="eq(ref('plan'), 'enterprise')">
 *   <EnterpriseFields />
 * </When>
 * ```
 */
export const When = defineComponent({
  name: "When",
  props: {
    cond: { type: Object as PropType<Predicate>, required: true },
  },
  setup(props, { slots }) {
    const result = usePredicate(() => props.cond);

    return () => (result.value === true ? slots.default?.() : null);
  },
});
