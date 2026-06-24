import { useDiscriminatedUnionKeyValues, useDynzFormContext } from "@dynz/react-hook-form";
import { type DiscriminatedUnionSchema, findSchemaByPath, type OptionsSchema, SchemaType } from "dynz";
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { DynzFormField } from "./dynz-form-field";

export type DynzSelectProps = {
  name: string;
};

export function DynzUnionKey({ name }: DynzSelectProps) {
  const { watch } = useDynzFormContext();

  const vals = watch()
  console.log('val', vals)

  // const innerSchema = findSchemaByPath<DiscriminatedUnionSchema>(`$.${name}`, schema, SchemaType.DISCRIMINATED_UNION);

  // Get options from schema if not provided via props
  const options = useDiscriminatedUnionKeyValues(name);

  console.log('options', options)
  return (
    <DynzFormField
      name={name}
      // rhfName={name}
      render={({ field, translations, required, readOnly }) => (
        <FormItem>
          <FormLabel>
            {translations.label}
            {required && " *"}
          </FormLabel>
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
          {translations.description && <FormDescription>{translations.description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
