import { FormControl } from "../ui/form";
import { Input } from "../ui/input";
import { DynzFormField } from "./dynz-form-field";
import { DynzFieldShell } from "./field-shell";
import { useFieldTranslations } from "./hooks/use-field-translations";

export type DynzNumberInputProps = {
  name: string;
  step?: number;
};

export function DynzNumberInput({ name, step }: DynzNumberInputProps) {
  const translations = useFieldTranslations(name);

  return (
    <DynzFormField
      name={name}
      render={({ field, required, readOnly }) => (
        <DynzFieldShell label={translations.label} required={required} description={translations.description}>
          <FormControl>
            <Input
              type="number"
              placeholder={translations.placeholder}
              step={step}
              {...field}
              value={field.value ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                field.onChange(value ? Number(value) : undefined);
              }}
              readOnly={readOnly}
            />
          </FormControl>
        </DynzFieldShell>
      )}
    />
  );
}
