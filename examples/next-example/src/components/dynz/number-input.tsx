import { DynzField } from "@dynz/react-hook-form";
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { useFieldTranslations } from "./hooks/use-field-translations";

export type DynzNumberInputProps = {
  name: string;
  step?: number;
};

export function DynzNumberInput({ name, step }: DynzNumberInputProps) {

  const translations = useFieldTranslations(name)

  return (
    <DynzField
      name={name}
      render={({ field, required, readOnly }) => (
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
