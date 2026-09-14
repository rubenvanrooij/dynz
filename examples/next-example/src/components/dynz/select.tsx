import { useOptions } from "@dynz/react-hook-form";
import { FormControl } from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { DynzFormField } from "./dynz-form-field";
import { DynzFieldShell } from "./field-shell";
import { useFieldTranslations } from "./hooks/use-field-translations";

export type DynzSelectProps = {
  name: string;
  // options?: readonly string[];
};

export function DynzSelect({ name }: DynzSelectProps) {
  const translations = useFieldTranslations(name);
  const schemaOptions = useOptions(name);

  return (
    <DynzFormField
      name={name}
      render={({ field, required, readOnly }) => (
        <DynzFieldShell label={translations.label} required={required} description={translations.description}>
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
        </DynzFieldShell>
      )}
    />
  );
}
