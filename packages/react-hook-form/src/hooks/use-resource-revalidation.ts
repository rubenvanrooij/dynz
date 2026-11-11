import { expandArrayItems, getResourceDependents, pathSegments, type Schema } from "dynz";
import { useEffect, useMemo } from "react";
import { type FieldPath, type FieldValues, type UseFormReturn, useFormState } from "react-hook-form";
import type { ResourceStore } from "./resource-store";

/**
 * Re-validates the fields that read a resource when its state changes: react-hook-form
 * only re-validates on value changes, but a settled lookup can change a field's result too.
 * Only fields the user interacted with (touched, erroring, or after a submit) are re-validated.
 */
export function useResourceRevalidation<TFieldValues extends FieldValues, TContext, TTransformed>(
  form: Pick<
    UseFormReturn<TFieldValues, TContext, TTransformed>,
    "control" | "getValues" | "getFieldState" | "trigger"
  >,
  schema: Schema,
  resources: ResourceStore
): void {
  const { control, getValues, getFieldState, trigger } = form;
  const { isSubmitted } = useFormState({ control });
  const dependents = useMemo(() => getResourceDependents(schema), [schema]);

  useEffect(() => {
    let previous = resources.getStates();

    return resources.subscribe(() => {
      const states = resources.getStates();
      // a settled entry keeps its state object across sets, so identity tells what changed
      const changed = Object.keys({ ...previous, ...states }).filter((path) => previous[path] !== states[path]);
      previous = states;

      const values = getValues();
      const fields = changed
        .flatMap((path) => dependents[pathSegments(path).at(-1) ?? ""] ?? [])
        .flatMap((path) => expandArrayItems(path, schema, values))
        // field names come from the schema at runtime, not from the form's value type
        .map((path) => pathSegments(path).slice(1).join(".") as FieldPath<TFieldValues>)
        .filter((field, index, all) => all.indexOf(field) === index)
        .filter((field) => {
          const { isTouched, error } = getFieldState(field);
          return isSubmitted || isTouched || error !== undefined;
        });

      if (fields.length > 0) {
        void trigger(fields);
      }
    });
  }, [schema, resources, dependents, isSubmitted, getValues, getFieldState, trigger]);
}
