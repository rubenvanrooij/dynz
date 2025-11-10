"use client"

import { DynzFormProvider, useDynzForm } from "@dynz/react-hook-form";
import type { ErrorMessage, ObjectSchema, SchemaValues } from "dynz";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { DefaultValues } from "react-hook-form";

export type FormProps<T extends ObjectSchema<never>, A extends SchemaValues<T>> = {
  name: string;
  schema: T;
  children?: ReactNode;
  defaultValues?: DefaultValues<A>;
  onSubmit?: (values: SchemaValues<T>) => void;
};

export function DynzForm<T extends ObjectSchema<never>, A extends SchemaValues<T>>({
  schema,
  children,
  onSubmit,
  defaultValues,
  name,
}: FormProps<T, A>) {
  const t = useTranslations();

  const methods = useDynzForm({
    schema,
    mode: 'all',
    defaultValues,
    schemaOptions: {
      stripNotIncludedValues: true,
    },
    resolverOptions: {
      messageTransformer: (error: ErrorMessage) => {
        const customErrorMessagePath = `${name}.${error.path.slice(2)}.errors.${error.customCode}`;

        return t.has(customErrorMessagePath)
          ? t(customErrorMessagePath, error as unknown as Record<string, string | number | Date>)
          : t(`errors.${error.customCode}`, error as unknown as Record<string, string | number | Date>);
      },
    },
  });

  return (
    <DynzFormProvider {...methods}>
      {/* <form id={name} onSubmit={methods.handleSubmit((values) => onSubmit?.(values))}> */}
        {children}
      {/* </form> */}
    </DynzFormProvider>
  );
}
