import type { ReactNode } from "react";
import { type UseDynzFieldReturn, useDynzField } from "../hooks/use-dynz-field";

export type DynzFieldProps = {
  name: string;
  render: (props: UseDynzFieldReturn) => ReactNode;
};

/**
 * Render-prop wrapper around `useDynzField`: renders nothing when the field isn't
 * currently included, and hands everything else to `render` otherwise.
 *
 * ```tsx
 * <DynzField name="companyName" render={({ field, fieldState, required, readOnly }) => (
 *   <input {...field} readOnly={readOnly} aria-required={required} />
 * )} />
 * ```
 */
export function DynzField({ name, render }: DynzFieldProps) {
  const result = useDynzField(name);

  if (!result.included) {
    return null;
  }

  return <>{render(result)}</>;
}
