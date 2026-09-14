import type { ObjectSchema } from "dynz";
import type { ReactElement, ReactNode } from "react";
import { render, type RenderResult, renderHook, type RenderHookResult } from "@testing-library/react";
import type { FieldValues } from "react-hook-form";
import { DynzFormProvider } from "../components/dynz-form-provider";
import { type UseDynzFormReturn, useDynzForm } from "../hooks/use-dynz-form";

/**
 * Renders `hook` (or a JSX tree, via {@link renderDynzUi}) inside a real
 * `useDynzForm`/`DynzFormProvider` tree, so `useDynzFormContext`/`useController`/
 * `useWatch` behave exactly as they do in an application.
 *
 * `defaultValues` seeds the form's actual initial field values (react-hook-form's
 * own option) — not to be confused with `useDynzForm`'s `currentValues`, which is
 * only a mutability-diffing reference, not the form's starting state.
 *
 * Not part of the public API — this module is only imported by tests.
 */
export function renderDynzHook<T, TSchema extends ObjectSchema<never>>(
  schema: TSchema,
  defaultValues: FieldValues | undefined,
  hook: () => T
): RenderHookResult<T, unknown> & { form: UseDynzFormReturn<TSchema> } {
  let form!: UseDynzFormReturn<TSchema>;

  function Wrapper({ children }: { children: ReactNode }) {
    form = useDynzForm(defaultValues === undefined ? { schema } : { schema, defaultValues });
    return <DynzFormProvider {...form}>{children}</DynzFormProvider>;
  }

  const result = renderHook(hook, { wrapper: Wrapper });

  return { ...result, form };
}

export function renderDynzUi<TSchema extends ObjectSchema<never>>(
  schema: TSchema,
  defaultValues: FieldValues | undefined,
  ui: ReactElement
): RenderResult & { form: UseDynzFormReturn<TSchema> } {
  let form!: UseDynzFormReturn<TSchema>;

  function Wrapper({ children }: { children: ReactNode }) {
    form = useDynzForm(defaultValues === undefined ? { schema } : { schema, defaultValues });
    return <DynzFormProvider {...form}>{children}</DynzFormProvider>;
  }

  const result = render(ui, { wrapper: Wrapper });

  return { ...result, form };
}
