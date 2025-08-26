import { DetailedHTMLProps, InputHTMLAttributes, SelectHTMLAttributes, useContext } from "react"
import { useFormContext } from "react-hook-form"
import { SchemaContext } from "./form"
import { findSchemaByPath, isIncluded } from "dynz/resolve"
import { useIsIncluded } from "@/is-included"
import { isIn } from "dynz/conditions"
import { OptionsSchema, SchemaType } from "dynz/types"

export type SelectProps<T extends string> = {
    path: T
} & DetailedHTMLProps<SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>

export function Select<T extends string>({ path, ...props }: SelectProps<T>) {

    const {schema } = useContext(SchemaContext)
    const { register, formState, getFieldState } = useFormContext()
    const { error } = getFieldState(path, formState)

    const isIncluded = useIsIncluded(schema, `$.${path}`)

    const innerSchema = findSchemaByPath<OptionsSchema>(`$.${path}`, schema, SchemaType.OPTIONS)

    if(isIncluded === false) {
        return <></>
    }

    return (<>
    {path}
     <select {...props} {...register(path)}>
        <option value={undefined}>{'-- select an option --'}</option>
        {innerSchema.options.map((option) => (
            <option key={option} value={option}>{option}</option>
        ) )}
    </select>
      <p>{error?.message}</p></>)
}