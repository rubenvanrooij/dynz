import { useDynzFormContext } from "@dynz/react-hook-form";
import { findSchemaByPath, type OptionsSchema, SchemaType } from "dynz";
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { DynzFormField } from "./dynz-form-field";

export type DynzSelectProps = {
  name: string;
  options?: readonly string[];
};

export function DynzSelect({ name, options: propOptions }: DynzSelectProps) {
  const { schema } = useDynzFormContext();

  // Get options from schema if not provided via props
  const schemaOptions = propOptions ?? (() => {
    try {
      const innerSchema = findSchemaByPath<OptionsSchema>(`$.${name}`, schema, SchemaType.OPTIONS);
      return innerSchema?.options ?? [];
    } catch {
      return [];
    }
  })();

  return (
    <DynzFormField
      name={name}
      render={({ field, translations, required, readOnly }) => (
        <FormItem>
          <FormLabel>
            {translations.label}
            {required && " *"}
          </FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value}
            disabled={readOnly}
          >
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={translations.placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {schemaOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
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
