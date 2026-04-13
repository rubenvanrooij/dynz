import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { DynzFormField } from "./dynz-form-field";

export type DynzDateInputProps = {
  name: string;
};

export function DynzDateInput({ name }: DynzDateInputProps) {
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
          {translations.description && <FormDescription>{translations.description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
