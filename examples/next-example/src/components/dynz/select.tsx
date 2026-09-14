import { DynzField, useOptions } from "@dynz/react-hook-form";
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useFieldTranslations } from "./hooks/use-field-translations";

export type DynzSelectProps = {
  name: string;
  // options?: readonly string[];
};

export function DynzSelect({ name }: DynzSelectProps) {
  const translations = useFieldTranslations(name)
  const schemaOptions = useOptions(name)

  return (
    <DynzField
      name={name}
      render={({ field, required, readOnly }) => (
        <FormItem>
          <FormLabel>
            {translations.label}
            {required && " *"}
          </FormLabel>
          <Select onValueChange={field.onChange} value={field.value} disabled={readOnly}>
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={translations.placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {schemaOptions.map((option) => (
                <SelectItem key={option.toString()} value={option.toString()}>
                  {option.toString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {translations.description && <FormDescription>{translations.description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
