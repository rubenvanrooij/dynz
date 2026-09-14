import { ensureAbsolutePath, findSchemaByPath, type Schema } from "dynz";
import {
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldValues,
  useController,
} from "react-hook-form";
import { useDynzFormContext } from "./use-dynz-form-context";
import { useIsIncluded } from "./use-is-included";
import { useIsMutable } from "./use-is-mutable";
import { useIsRequired } from "./use-is-required";

export type UseDynzFieldReturn = {
  /** `true` unless the schema resolved `included` to something other than exactly `true`. */
  included: boolean;
  /** `true` unless the schema resolved `required` to exactly `false`. */
  required: boolean;
  /** `true` only when the schema resolved `mutable` to exactly `false`. */
  readOnly: boolean;
  /** This field's own schema (e.g. for `.ui`/`.meta` rendering hints). */
  schema: Schema;
  field: ControllerRenderProps<FieldValues, string>;
  fieldState: ControllerFieldState;
  formState: ReturnType<typeof useController>["formState"];
};

/**
 * Binds a single field to the form created by `useDynzForm` — the per-field wiring
 * every consumer otherwise hand-writes: `useController` bound to the form's `control`,
 * plus the schema's `included`/`required`/`mutable` state and the field's own schema.
 * Also wires up cross-field revalidation (`rules.deps`), so a field whose validity
 * depends on another field re-validates when that other field changes.
 *
 * ```tsx
 * const { field, fieldState, included, required, readOnly } = useDynzField("companyName");
 * if (!included) return null;
 * return <input {...field} readOnly={readOnly} aria-required={required} />;
 * ```
 */
export function useDynzField(name: string): UseDynzFieldReturn {
  const { control, schema: rootSchema, getDependencies } = useDynzFormContext();

  const included = useIsIncluded(name);
  const required = useIsRequired(name);
  const mutable = useIsMutable(name);
  const schema = findSchemaByPath(ensureAbsolutePath(name, "$"), rootSchema);

  const dependencies = getDependencies(name);
  const { field, fieldState, formState } = useController({
    name,
    control,
    ...(dependencies ? { rules: { deps: dependencies } } : {}),
  });

  return {
    included: Boolean(included),
    required: required !== false,
    readOnly: mutable === false,
    schema,
    field,
    fieldState,
    formState,
  };
}
