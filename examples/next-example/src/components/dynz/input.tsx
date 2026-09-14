import { FormControl } from "../ui/form";
import { Input } from "../ui/input";
import { DynzFormField } from "./dynz-form-field";
import { DynzFieldShell } from "./field-shell";
import { useFieldTranslations } from "./hooks/use-field-translations";

export type DynzInputProps = {
  name: string;
} & Pick<React.ComponentProps<"input">, "type">;

export function DynzInput({ name, ...props }: DynzInputProps) {
  const translations = useFieldTranslations(name);

  return (
    <DynzFormField
      name={name}
      render={({ field, required, readOnly }) => (
        <DynzFieldShell label={translations.label} required={required} description={translations.description}>
          <FormControl>
            <Input
              placeholder={translations.placeholder}
              {...props}
              {...field}
              value={field.value || ""}
              onChange={(e) => field.onChange(e.target.value || undefined)}
              readOnly={readOnly}
            />
          </FormControl>
        </DynzFieldShell>
      )}
    />
  );
}
