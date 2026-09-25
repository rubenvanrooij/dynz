import { useOptions } from "@dynz/react-hook-form";
import { FormControl } from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { DynzFormField } from "./dynz-form-field";
import { DynzFieldShell } from "./field-shell";
import { useFieldTranslations } from "./hooks/use-field-translations";

export type DynzSelectProps = {
  name: string;
};

export function DynzUnionKey({ name }: DynzSelectProps) {
  // A discriminator resolves to an options schema of every member's value
  const options = useOptions(name);
  const translations = useFieldTranslations(name);

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
              {options.map((option) => (
                <SelectItem key={option.value?.toString()} value={option.value?.toString() || ""}>
                  {option.value?.toString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DynzFieldShell>
      )}
    />
  );
}
