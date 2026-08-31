import { defineComponent } from "vue";
import { useIsIncluded } from "../composables";

/**
 * Renders its default slot only while the named field is included.
 *
 * ```vue
 * <IsIncluded name="companyName">
 *   <CompanyNameInput />
 * </IsIncluded>
 * ```
 */
export const IsIncluded = defineComponent({
  name: "IsIncluded",
  props: {
    name: { type: String, required: true },
  },
  setup(props, { slots }) {
    const isIncluded = useIsIncluded(() => props.name);

    return () => (isIncluded.value === false ? null : slots.default?.());
  },
});
