import { useDiscriminatedUnionKeyValues } from "@dynz/react-hook-form";
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { DynzFormField } from "./dynz-form-field";

export type DynzSelectProps = {
  name: string;
};

export function DynzUnionKey({ name }: DynzSelectProps) {
  // Get options from schema if not provided via props
  const options = useDiscriminatedUnionKeyValues(name);

  return (
    <DynzFormField
      name={name}
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
                <SelectItem
                  key={option.value?.toString()}
                  value={option.value?.toString() || ""}
                  disabled={!option.enabled}
                >
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
