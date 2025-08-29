import { DetailedHTMLProps, InputHTMLAttributes, SelectHTMLAttributes, useContext } from "react"
import { useFormContext } from "react-hook-form"
import { SchemaContext } from "./form"
import { useIsIncluded } from "@/hooks/is-included"

export type BooleanFieldProps<T extends string> = {
    path: T
} & DetailedHTMLProps<SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>

export function BooleanField<T extends string>({ path, ...props }: BooleanFieldProps<T>) {

    const {schema } = useContext(SchemaContext)
    const { register, formState, getFieldState } = useFormContext()
    const { error } = getFieldState(path, formState)

    const isIncluded = useIsIncluded(schema, `$.${path}`)

    if(isIncluded === false) {
        return <></>
    }

    return (<>
    {path}
     <select {...props} {...register(path)}>
         <option value={undefined}>{'-- select an option --'}</option>
         <option value="true">Yes</option>
         <option value="false">No</option>
    </select>
      <p>{error?.message}</p></>)
}