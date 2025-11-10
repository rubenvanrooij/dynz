import {
  IsIncluded,
  useDynzFormContext,
  useIsMutable,
  useIsRequired,
} from "@dynz/react-hook-form";
import {
  findSchemaByPath,
  type OptionsSchema,
  SchemaType,
} from "dynz";
import { useTranslations } from "next-intl";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export type BaseInputProps = {
  name: string;
  description?: string;
  i18nPath: string;
};


type DynzFormLabelProps = {
  name: string;
  i18nPath: string;
};

export function DynzFormLabel({ name, i18nPath }: DynzFormLabelProps) {
  const isRequired = useIsRequired(name);
  const t = useTranslations();

  return (
    <FormLabel>
      {t(`${i18nPath}.${name}.label`)}
      {isRequired && " *"}
    </FormLabel>
  );
}

export function DynzTextInput({ name, description, i18nPath }: BaseInputProps) {
  const { control } = useDynzFormContext();
  const t = useTranslations();
  const isMutable = useIsMutable(name);

  return (
    <IsIncluded name={name}>
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <DynzFormLabel i18nPath={i18nPath} name={name} />
            <FormControl>
              <Input placeholder={t(`${i18nPath}.${name}.placeholder`)} {...field} readOnly={isMutable === false} />
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    </IsIncluded>
  );
}

export function DynzSelect({ name, description, i18nPath }: BaseInputProps) {
  const { schema, control } = useDynzFormContext();

  const innerSchema = findSchemaByPath<OptionsSchema>(`$.${name}`, schema, SchemaType.OPTIONS);
  const isMutable = useIsMutable(name);
  const t = useTranslations();

  return (
    <IsIncluded name={name}>
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <DynzFormLabel i18nPath={i18nPath} name={name} />
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
            {t.has(`${i18nPath}.${name}.description`) && <FormDescription>{`${i18nPath}.${name}.placeholder`}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    </IsIncluded>
  );
}

export function DynzBoolean({ name, description, i18nPath }: BaseInputProps) {
  const { control } = useDynzFormContext();

  const isMutable = useIsMutable(name);
  const t = useTranslations();

  return (
    <IsIncluded name={name}>
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <DynzFormLabel i18nPath={i18nPath} name={name} />
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
    </IsIncluded>
  );
}
