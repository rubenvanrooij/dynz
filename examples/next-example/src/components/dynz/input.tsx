import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { DynzFormField } from "./dynz-form-field";

export type DynzInputProps = {
  name: string;
} & Pick<React.ComponentProps<"input">, "type">;

export function DynzInput({ name,...props }: DynzInputProps) {
  return (
    <DynzFormField name={name} render={({ field, translations, required, readOnly }) => (
       <FormItem>
        <FormLabel>
          {translations.label}
          {required && " *"}
        </FormLabel>
        <FormControl>
          <Input
            placeholder={translations.placeholder}
            {...props}
            {...field}
            value={field.value || ''}
            onChange={((e) => field.onChange(e.target.value || undefined))}
            readOnly={readOnly}
          />
        </FormControl>
        {translations.description && (
          <FormDescription>{translations.description}</FormDescription>
        )}
        <FormMessage />
      </FormItem>
    )} />

  );
}
