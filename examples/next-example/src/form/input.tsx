import { DetailedHTMLProps, InputHTMLAttributes, useContext } from "react"
import { useFormContext } from "react-hook-form"
import { SchemaContext } from "./form"
import { useIsIncluded } from "@/hooks/is-included"
import { useIsMutable } from "@/hooks/is-mutable"

export type InputProps<T extends string> = {
    path: T
} & DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>

export function Input<T extends string>({ path, ...props }: InputProps<T>) {

    const {schema } = useContext(SchemaContext)
    const { register, formState, getFieldState } = useFormContext()

    const isIncluded = useIsIncluded(schema, `$.${path}`)
    const isMutable = useIsMutable(schema, `$.${path}`)

    if(isIncluded === false) {
        return <></>
    }

     const { error } = getFieldState(path, formState)

    return (<>
    {path}
     <input {...props} {...register(path)} readOnly={isMutable === false} />
      <p>{error?.message}</p></>)
}