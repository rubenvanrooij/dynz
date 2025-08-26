import { isRequired } from "dynz/resolve";
import { Schema } from "dynz/types";
import { useFormContext } from "react-hook-form";


export function useIsRequired(schema: Schema, path: string) {
    const { watch } = useFormContext()
    const values = watch()
    return isRequired(schema, path, values, false)
}