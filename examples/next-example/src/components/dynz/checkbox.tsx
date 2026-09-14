import { DynzField } from "@dynz/react-hook-form";
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useFieldTranslations } from "./hooks/use-field-translations";

export type DynzCheckboxProps = {
  name: string;
};

export function DynzCheckbox({ name }: DynzCheckboxProps) {

  const translations = useFieldTranslations(name);
  
  return (
    <DynzField
      name={name}
      render={({ field, required, readOnly }) => (
        <FormItem>
          <FormLabel>
            {translations.label}
            {required && " *"}
          </FormLabel>
          <Select
            onValueChange={(value) => field.onChange(value === "true")}
            value={field.value === true ? "true" : field.value === false ? "false" : undefined}
            disabled={readOnly}
          >
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={translations.placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="true">Ja</SelectItem>
              <SelectItem value="false">Nee</SelectItem>
            </SelectContent>
          </Select>
          {translations.description && <FormDescription>{translations.description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
