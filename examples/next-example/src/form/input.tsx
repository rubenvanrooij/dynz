import { DetailedHTMLProps, InputHTMLAttributes, useContext } from "react"
import { useFormContext } from "react-hook-form"
import { SchemaContext } from "./form"
import { isIncluded } from "dynz/resolve"
import { useIsIncluded } from "@/is-included"
import { isIn } from "dynz/conditions"

export type InputProps<T extends string> = {
    path: T
} & DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>

export function Input<T extends string>({ path, ...props }: InputProps<T>) {

    const {schema } = useContext(SchemaContext)
    const { register, formState, getFieldState } = useFormContext()

    const isIncluded = useIsIncluded(schema, `$.${path}`)

    if(isIncluded === false) {
        return <></>
    }

     const { error } = getFieldState(path, formState)

    return (<>
    {path}
     <input {...props} {...register(path)} />
      <p>{error?.message}</p></>)
}