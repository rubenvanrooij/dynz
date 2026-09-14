import { DynzField, type DynzFieldProps } from "@dynz/react-hook-form";
import { FormFieldContext } from "../ui/form";

export function DynzFormField(props: DynzFieldProps) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <DynzField {...props} />
    </FormFieldContext.Provider>
  );
}
