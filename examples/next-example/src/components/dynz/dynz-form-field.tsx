import { useDynzFormContext, useIsIncluded, useIsMutable, useIsRequired } from "@dynz/react-hook-form";
import { useTranslations } from "next-intl";
import { memo, useMemo } from "react";
import type {
  Control,
  ControllerFieldState,
  ControllerRenderProps,
  FieldValues,
  UseFormStateReturn,
} from "react-hook-form";
import { FormField } from "../ui/form";

type TranslationsObject = {
  label?: string | undefined;
  placeholder?: string | undefined;
  description?: string | undefined;
};

type DynzFormFieldProps = {
  name: string;
  rhfName?: string
  render: ({
    field,
    translations,
    fieldState,
    formState,
  }: {
    name: string;
    translations: TranslationsObject;
    readOnly: boolean;
    required: boolean;
    field: ControllerRenderProps<FieldValues, string>;
    fieldState: ControllerFieldState;
    formState: UseFormStateReturn<FieldValues>;
  }) => React.ReactElement;
};

export const DynzFormField = ({ name, rhfName, render }: DynzFormFieldProps) => {
  const { control, getDependencies, name: i18nPath } = useDynzFormContext();
  const t = useTranslations();
  const isMutable = useIsMutable(name);
  const isRequired = useIsRequired(name);
  const isIncluded = useIsIncluded(name);

  const translations = useMemo(() => {
    const getTranslation = (key: string) => {
      return t.has(key) ? t(key) : undefined;
    };

    return {
      label: getTranslation(`${i18nPath}.${name}.label`),
      placeholder: getTranslation(`${i18nPath}.${name}.placeholder`),
      description: getTranslation(`${i18nPath}.${name}.description`),
    };
  }, [t, i18nPath, name]);

  const dependencies = useMemo(() => getDependencies(name), [getDependencies, name]);

  return (
    <DynzFormFieldInner
      name={name}
      rhfName={rhfName}
      control={control}
      dependencies={dependencies}
      readOnly={isMutable === false}
      required={isRequired !== false}
      included={isIncluded !== false}
      translations={translations}
      render={render}
    />
  );
};

/**
 * Inner component that only re-renders when the props change
 */
const DynzFormFieldInner = memo(
  ({
    name,
    rhfName,
    control,
    dependencies,
    readOnly,
    required,
    included,
    translations,
    render,
  }: {
    name: string;
    rhfName?: string;
    control: Control<FieldValues>;
    dependencies: string[] | undefined;
    readOnly: boolean;
    required: boolean;
    included: boolean;
    translations: TranslationsObject;
    render: DynzFormFieldProps["render"];
  }) => {
    if (!included) {
      return null;
    }

    return (
      <FormField
        control={control}
        name={rhfName || name}
        rules={{
          deps: dependencies,
        }}
        render={(args) =>
          render({
            name,
            readOnly,
            required,
            translations,
            ...args,
          })
        }
      />
    );
  }
);

DynzFormFieldInner.displayName = "DynzFormFieldInner";
