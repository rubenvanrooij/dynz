import { dynzResolver } from "@dynz/react-hook-form-resolver/index"
import { Schema, SchemaValues } from "dynz/types"
import { createContext, ReactNode } from "react"
import { DefaultValues, FormProvider, Resolver, useForm } from 'react-hook-form'

export type FormProps<T extends Schema> = {
    schema: T
    children?: ReactNode
    defaultValues?: DefaultValues<SchemaValues<T>>
    onSubmit?: (values: SchemaValues<T>) => void
}

export const SchemaContext = createContext<{ schema: Schema }>({} as unknown as { schema: Schema})

export function Form<T extends Schema>({ schema, children, onSubmit, defaultValues }: FormProps<T>) {

    const methods = useForm<SchemaValues<typeof schema>>({
        resolver: dynzResolver(schema, undefined, {
          strict: false,
        }),
        defaultValues,
    })

    return (<SchemaContext.Provider value={{schema}}> <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit((values) => onSubmit && onSubmit(values))}>
            {children}
        </form>
    </FormProvider></SchemaContext.Provider>)
}

//   const {
//     register,
//     handleSubmit,
//     watch,
//     formState: { errors },
//   } = useForm<SchemaValues<typeof schema>>({
//     resolver: dynzResolver(schema, undefined, {
//       strict: false,
//     }, {
//       messageTransformer: (message) => {

//         console.log(message)
//         const { schema, value, current, ...rest } = message

//         // parse message args to only contain strings numbers and dates
//         const messageArgs = Object.entries(rest).reduce<Record<string, string | number | Date>>((prev, [key, value]) => {
//           if(typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
//             return {
//               ...prev,
//               [key]: value
//             }
//           }

//           return prev
//         }, {})
        
//         return t(`form.errorMessages.${message.schema.type}.${message.customCode}`, messageArgs)
//       }
//     })
//   })
