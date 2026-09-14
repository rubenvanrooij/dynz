import { useDynzFormContext } from "@dynz/react-hook-form";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

type TranslationsObject = {
  label?: string | undefined;
  placeholder?: string | undefined;
  description?: string | undefined;
};

export function useFieldTranslations(name: string): TranslationsObject { 
    const { name: i18nPath } = useDynzFormContext();
    const t = useTranslations();

    return useMemo(() => {
    const getTranslation = (key: string) => {
      return t.has(key) ? t(key) : undefined;
    };

    return {
      label: getTranslation(`${i18nPath}.${name}.label`),
      placeholder: getTranslation(`${i18nPath}.${name}.placeholder`),
      description: getTranslation(`${i18nPath}.${name}.description`),
    };
  }, [t, i18nPath, name]);
}
