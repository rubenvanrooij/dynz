import { type VueWrapper, mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import type { DynzContext } from "../context";
import { DYNZ_INJECTION_KEY } from "../context";

/**
 * Runs a composable inside a real component instance so `inject`, `computed` and the
 * component lifecycle behave exactly as they do in an application.
 *
 * Not part of the public API — this module is only imported by tests.
 */
export function mountComposable<T>(
  setup: () => T,
  context?: DynzContext<never> | DynzContext
): { result: T; wrapper: VueWrapper } {
  let result: T | undefined;

  const wrapper = mount(
    defineComponent({
      setup() {
        result = setup();
        return () => null;
      },
    }),
    context === undefined
      ? {}
      : { global: { provide: { [DYNZ_INJECTION_KEY as symbol]: context as unknown as DynzContext } } }
  );

  return { result: result as T, wrapper };
}
