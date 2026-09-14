import type { ObjectSchema } from "dynz";
import { type VueWrapper, mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import type { UseDynzFormOptions, UseDynzFormReturn } from "../composables/use-dynz-form";
import { useDynzForm } from "../composables/use-dynz-form";

/**
 * Mounts a real vee-validate form via `useDynzForm`, running `useChild` (when given)
 * in a child component nested inside the same tree. This is the only arrangement that
 * gives a descendant `useDynzField`/vee-validate `useField` call access to the form
 * context vee-validate itself injects — a bare `useDynzForm(...)` call outside a
 * mounted component tree does not work, since vee-validate's `useForm` relies on the
 * component instance for its own lifecycle/provide wiring.
 *
 * Not part of the public API — this module is only imported by tests.
 */
export function mountDynzForm<TSchema extends ObjectSchema<never>, TResult = undefined>(
  options: UseDynzFormOptions<TSchema>,
  useChild?: () => TResult
): { wrapper: VueWrapper; form: UseDynzFormReturn<TSchema>; result: TResult } {
  let form: UseDynzFormReturn<TSchema> | undefined;
  let result: TResult | undefined;

  const Child = defineComponent({
    setup() {
      result = useChild?.();
      return () => null;
    },
  });

  const wrapper = mount(
    defineComponent({
      setup() {
        form = useDynzForm(options);
        return () => h("form", [h(Child)]);
      },
    })
  );

  return { wrapper, form: form as UseDynzFormReturn<TSchema>, result: result as TResult };
}

/**
 * vee-validate debounces every schema validation run by 5ms (`debounceAsync(_validateSchema, 5)`,
 * shared by silent and non-silent runs) and field-level triggers (`field.setValue`,
 * `field.handleBlur`) never return that promise, so there is nothing to `await` after
 * them. `flushPromises()`/`nextTick()` alone only drain microtasks and do not advance
 * past that real `setTimeout`, so a test asserting on validation state after such a
 * trigger needs an actual timer tick — awaiting `form.validate()`/`form.validateField()`
 * directly does not need this, since their returned promise already resolves past it.
 */
export function waitForValidation(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 20));
}
