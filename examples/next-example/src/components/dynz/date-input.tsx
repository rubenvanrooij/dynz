import { FormControl } from "../ui/form";
import { Input } from "../ui/input";
import { DynzFormField } from "./dynz-form-field";
import { DynzFieldShell } from "./field-shell";
import { useFieldTranslations } from "./hooks/use-field-translations";
export type DynzDateInputProps = {
  name: string;
};

export function DynzDateInput({ name }: DynzDateInputProps) {
  const translations = useFieldTranslations(name);

  return (
    <DynzFormField
      name={name}
      render={({ field, required, readOnly }) => (
        <DynzFieldShell label={translations.label} required={required} description={translations.description}>
          <FormControl>
            <Input
              type="date"
              placeholder={translations.placeholder}
              {...field}
              value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : field.value || ""}
              onChange={(e) => {
                const value = e.target.value;
                field.onChange(value ? new Date(value) : undefined);
              }}
              readOnly={readOnly}
            />
          </FormControl>
        </DynzFieldShell>
      )}
    />
  );
}
