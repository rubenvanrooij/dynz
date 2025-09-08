import { dynzResolver } from "@dynz/react-hook-form-resolver";
import {
  type ErrorMessage,
  findSchemaByPath,
  type ObjectSchema,
  type OptionsSchema,
  type Schema,
  SchemaType,
  type SchemaValues,
} from "dynz";
import { useTranslations } from "next-intl";
import { createContext, type ReactNode, useContext } from "react";
import { type DefaultValues, FormProvider, useForm, useFormContext } from "react-hook-form";
import { useIsIncluded } from "@/hooks/is-included";
import { useIsMutable } from "@/hooks/is-mutable";
import { useIsRequired } from "@/hooks/is-required";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const SchemaContext = createContext<{ schema: Schema; i18nPath?: string }>(
  {} as unknown as { schema: Schema; i18nPath: string }
);

export type BaseInputProps = {
  name: string;
  description?: string;
};

type IncludedWrapper = {
  children?: ReactNode;
  name: string;
};

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

  const methods = useForm({
    resolver: dynzResolver(
      schema,
      undefined,
      {
        stripNotIncludedValues: true,
      },
      {
        messageTransformer: (error: ErrorMessage) => {
          const customErrorMessagePath = `${name}.${error.path.slice(2)}.errors.${error.customCode}`;
          return t.has(customErrorMessagePath)
            ? t(customErrorMessagePath, error as unknown as Record<string, string | number | Date>)
            : t(`errors.${error.customCode}`, error as unknown as Record<string, string | number | Date>);
        },
      }
    ),
    defaultValues,
  });

  return (
    <SchemaContext.Provider value={{ schema, i18nPath: name }}>
      <FormProvider {...methods}>
        <form id={name} onSubmit={methods.handleSubmit((values) => onSubmit?.(values))}>
          {children}
        </form>
      </FormProvider>
    </SchemaContext.Provider>
  );
}

export function DynzIncludedWrapper({ name, children }: IncludedWrapper) {
  const { schema } = useContext(SchemaContext);
  const isIncluded = useIsIncluded(schema, `$.${name}`);

  if (isIncluded === false) {
    return;
  }

  return children;
}

type DynzFormLabelProps = {
  name: string;
};

export function DynzFormLabel({ name }: DynzFormLabelProps) {
  const { schema, i18nPath } = useContext(SchemaContext);
  const isRequired = useIsRequired(schema, `$.${name}`);
  const t = useTranslations();

  return (
    <FormLabel>
      {t(`${i18nPath}.${name}.label`)}
      {isRequired && " *"}
    </FormLabel>
  );
}

export function DynzTextInput({ name, description }: BaseInputProps) {
  const { schema, i18nPath } = useContext(SchemaContext);
  const { control } = useFormContext();
  const t = useTranslations();

  const isMutable = useIsMutable(schema, `$.${name}`);

  return (
    <DynzIncludedWrapper name={name}>
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <DynzFormLabel name={name} />
            <FormControl>
              <Input
                placeholder={t(`${i18nPath}.${name}.placeholder`)}
                {...field}
                value={field.value || ""}
                readOnly={isMutable === false}
              />
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    </DynzIncludedWrapper>
  );
}

export function DynzSelect({ name, description }: BaseInputProps) {
  const { schema, i18nPath } = useContext(SchemaContext);
  const { control } = useFormContext();

  const innerSchema = findSchemaByPath<OptionsSchema>(`$.${name}`, schema, SchemaType.OPTIONS);
  const isMutable = useIsMutable(schema, `$.${name}`);
  const t = useTranslations();

  return (
    <DynzIncludedWrapper name={name}>
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <DynzFormLabel name={name} />
            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isMutable === false}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t(`${i18nPath}.${name}.placeholder`)} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {innerSchema.options.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    </DynzIncludedWrapper>
  );
}

export function DynzBoolean({ name, description }: BaseInputProps) {
  const { schema, i18nPath } = useContext(SchemaContext);
  const { control } = useFormContext();

  const isMutable = useIsMutable(schema, `$.${name}`);
  const t = useTranslations();

  return (
    <DynzIncludedWrapper name={name}>
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <DynzFormLabel name={name} />
            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isMutable === false}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t(`${i18nPath}.${name}.placeholder`)} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="true">{t(`${i18nPath}.${name}.options.yes`)}</SelectItem>
                <SelectItem value="false">{t(`${i18nPath}.${name}.options.no`)}</SelectItem>
              </SelectContent>
            </Select>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    </DynzIncludedWrapper>
  );
}
