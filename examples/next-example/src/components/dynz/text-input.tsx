import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "../ui/form"
import { useFormContext } from "react-hook-form"
import { Input } from "../ui/input"
import { useIsIncluded } from "@/hooks/is-included"
import { ReactNode, useContext } from "react"
import { SchemaContext } from "@/form/form"
import { useIsMutable } from "@/hooks/is-mutable"
import { useIsRequired } from "@/hooks/is-required"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { findSchemaByPath, OptionsSchema, SchemaType } from "dynz"
import { useTranslations } from "next-intl"

export type BaseInputProps = {
    name: string
    description?: string
}

type IncludedWrapper = {
    children?: ReactNode
    name: string
}

export function DynzIncludedWrapper({ name, children }: IncludedWrapper) { 
    const {schema } = useContext(SchemaContext)
    const isIncluded = useIsIncluded(schema, `$.${name}`)

    if(isIncluded === false) {
        return <></>
    }

    return children
}

type DynzFormLabelProps = {
    name: string
}

export function DynzFormLabel({ name }: DynzFormLabelProps) {

    const {schema, i18nPath } = useContext(SchemaContext)
    const isRequired = useIsRequired(schema, `$.${name}`)
    const t = useTranslations()

    return <FormLabel>{t(`${i18nPath}.${name}.label`)}{isRequired && ' *'}</FormLabel>
}

export function DynzTextInput({ name, description }: BaseInputProps) {

    const { schema, i18nPath } = useContext(SchemaContext)
    const { control } = useFormContext()
    const t = useTranslations()

    const isMutable = useIsMutable(schema, `$.${name}`)

    return (<DynzIncludedWrapper name={name}><FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem>
                <DynzFormLabel name={name} />
                <FormControl>
                    <Input placeholder={t(`${i18nPath}.${name}.placeholder`)} {...field} readOnly={isMutable === false} />
                </FormControl>
                { description && <FormDescription>{description}</FormDescription> }
                <FormMessage />
            </FormItem>
        )}
    /></DynzIncludedWrapper>)
}


export function DynzSelect({ name, description }: BaseInputProps) {

    const { schema, i18nPath } = useContext(SchemaContext)
    const { control } = useFormContext()

    const innerSchema = findSchemaByPath<OptionsSchema>(`$.${name}`, schema, SchemaType.OPTIONS)
    const isMutable = useIsMutable(schema, `$.${name}`)
    const t = useTranslations()

    return (<DynzIncludedWrapper name={name}><FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem>
                <DynzFormLabel name={name} />
              <Select  onValueChange={field.onChange} defaultValue={field.value} disabled={isMutable === false}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t(`${i18nPath}.${name}.placeholder`)} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>

                    {innerSchema.options.map((option) => (
                        <SelectItem key={option} value={option.toString()}>{option}</SelectItem>
                    ))}

                </SelectContent>
              </Select>
              { description && <FormDescription>{description}</FormDescription> }
              <FormMessage />
            </FormItem>
        )}
    /></DynzIncludedWrapper>)
}

export function DynzBoolean({ name, description }: BaseInputProps) {

    const { schema, i18nPath } = useContext(SchemaContext)
    const { control } = useFormContext()

    const isMutable = useIsMutable(schema, `$.${name}`)
    const t = useTranslations()

    return (<DynzIncludedWrapper name={name}><FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem>
                <DynzFormLabel name={name} />
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isMutable === false}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t(`${i18nPath}.${name}.placeholder`)} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                    <SelectItem value="true">{t(`${i18nPath}.${name}.options.yes`)}</SelectItem>
                    <SelectItem value="false">{t(`${i18nPath}.${name}.options.no`)}</SelectItem>
                </SelectContent>
              </Select>
              { description && <FormDescription>{description}</FormDescription> }
              <FormMessage />
            </FormItem>
        )}
    /></DynzIncludedWrapper>)
}