import {
  changedResourcePaths,
  fieldPathsReadingResources,
  getResourceDependents,
  type ResourceStates,
  type Schema,
} from "dynz";
import type { FormContext } from "vee-validate";
import { type Ref, watch } from "vue";
import { toFieldName } from "../utils";

/**
 * Re-validates the fields that read a resource when its state changes: a field is validated
 * on input or blur, but a settled lookup can change its result too. Only fields the user
 * interacted with (touched, erroring, or after a submit) are re-validated.
 */
export function useResourceRevalidation(
  // biome-ignore lint/suspicious/noExplicitAny: works with any form's value types
  form: Pick<FormContext<any, any>, "values" | "errors" | "isFieldTouched" | "submitCount" | "validateField">,
  schema: Schema,
  states: Readonly<Ref<ResourceStates>>
): void {
  const dependents = getResourceDependents(schema);

  watch(states, (next, previous) => {
    fieldPathsReadingResources(changedResourcePaths(previous, next), dependents, schema, form.values)
      .map(toFieldName)
      .filter(
        (name) => form.submitCount.value > 0 || form.isFieldTouched(name) || form.errors.value[name] !== undefined
      )
      .forEach((name) => {
        void form.validateField(name);
      });
  });
}
