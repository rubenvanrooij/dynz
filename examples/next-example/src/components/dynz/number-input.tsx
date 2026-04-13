import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { DynzFormField } from "./dynz-form-field";

export type DynzNumberInputProps = {
  name: string;
  step?: number;
};

export function DynzNumberInput({ name, step }: DynzNumberInputProps) {
  return (
    <DynzFormField
      name={name}
      render={({ field, translations, required, readOnly }) => (
        <FormItem>
          <FormLabel>
            {translations.label}
            {required && " *"}
          </FormLabel>
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
          {translations.description && <FormDescription>{translations.description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
