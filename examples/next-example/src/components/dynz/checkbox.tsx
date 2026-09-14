import { FormControl } from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { DynzFormField } from "./dynz-form-field";
import { DynzFieldShell } from "./field-shell";
import { useFieldTranslations } from "./hooks/use-field-translations";

export type DynzCheckboxProps = {
  name: string;
};

export function DynzCheckbox({ name }: DynzCheckboxProps) {
  const translations = useFieldTranslations(name);

  return (
    <DynzFormField
      name={name}
      render={({ field, required, readOnly }) => (
        <DynzFieldShell label={translations.label} required={required} description={translations.description}>
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
              <SelectItem value="true">{translations.options.yes}</SelectItem>
              <SelectItem value="false">{translations.options.no}</SelectItem>
            </SelectContent>
          </Select>
        </DynzFieldShell>
      )}
    />
  );
}
