import type { ObjectSchema } from "dynz";
import type { ReactNode } from "react";
import { type FieldValues, FormProvider } from "react-hook-form";
import type { UseDynzFormReturn } from "../hooks/use-dynz-form";

/**
 * Props for DynzFormProvider component
 *
 * @template TSchema - The dynz ObjectSchema type defining the form structure
 * @template TFieldValues - The React Hook Form field values type
 */
export type DynzFormProviderProps<
  TSchema extends ObjectSchema<never>,
  TFieldValues extends FieldValues = FieldValues,
> = {
  /** The form content to be wrapped by the provider */
  children: ReactNode;
} & UseDynzFormReturn<TSchema, TFieldValues>;

/**
 * DynzFormProvider Component
 *
 * A wrapper around React Hook Form's FormProvider that integrates dynz schema validation
 * with automatic dependency tracking and cross-field validation triggers.
 *
 * This component automatically analyzes the dynz schema to identify field dependencies
 * (rules that reference other fields) and sets up DependencyTrigger components to
 * re-validate fields when their dependencies change.
 *
 * @example
 * ```tsx
 * import { object, string } from 'dynz';
 * import { DynzFormProvider, useDynzForm } from '@dynz/react-hook-form';
 *
 * const schema = object({
 *   fields: {
 *     password: string(),
 *     confirmPassword: string({
 *      rules: [equals(ref('password'))]
 *     })
 *   }
 * });
 *
 * function MyForm() {
 *   const form = useDynzForm({ schema });
 *
 *   return (
 *     <DynzFormProvider {...form}>
 *       <input {...register("password")} />
 *       <input {...register("confirmPassword")} />
 *       <button type="submit">Submit</button>
 *     </DynzFormProvider>
 *   );
 * }
 * ```
 *
 * @template TSchema - The dynz ObjectSchema type defining the form structure
 * @template TFieldValues - The React Hook Form field values type
 *
 * @param props - Component props including form methods from useDynzForm and children
 *
 * @returns A FormProvider with automatic dependency tracking
 *
 * @remarks
 * - Must be used with the return value from `useDynzForm` hook
 * - Automatically manages DependencyTrigger components based on schema dependencies
 * - The dependency map is extracted using `getRulesDependenciesMap` from the dynz schema
 * - Path slicing (`slice(2)`) removes the `$.` prefix from JSONPath expressions
 * - Inherits validation mode from the form control configuration
 * - All child components can access form context via `useDynzFormContext` hook
 *
 * @see {@link useDynzForm} for creating the form instance
 * @see {@link DependencyTrigger} for the underlying dependency validation component
 */
export const DynzFormProvider = <TSchema extends ObjectSchema<never>, TFieldValues extends FieldValues = FieldValues>({
  children,
  ...props
}: DynzFormProviderProps<TSchema, TFieldValues>) => {
  return <FormProvider {...props}>{children}</FormProvider>;
};
