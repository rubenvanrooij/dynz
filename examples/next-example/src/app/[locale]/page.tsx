"use client"

import { useForm, SubmitHandler } from "react-hook-form";
import { min, ref } from 'dynz/rules';
import { gte } from 'dynz/conditions';
import { number, object, string } from 'dynz/schema';
import { dynzResolver } from '@dynz/react-hook-form-resolver/index';
import { SchemaValues } from "dynz/types";
import { useTranslations } from "next-intl";

const stringRequiredRule = min(1, 'required')

const schema = object({
  fields: {
    firstName: string({
      required: false,
      rules: [stringRequiredRule]
      // rules: [min(ref('age'))],
    }),
    age: number({
      rules: [min(5)],
      required: false,
    }),
    sure: number({
      included: gte('age', 10),
      rules: [stringRequiredRule, min(5)],
      required: false,
    }),
  },
});


export default function Home() {

  const t = useTranslations();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SchemaValues<typeof schema>>({
    resolver: dynzResolver(schema, undefined, undefined, {
      messageTransformer: (message) => {

        const { schema, value, current, ...rest } = message

        // parse message args to only contain strings numbers and dates
        const messageArgs = Object.entries(rest).reduce<Record<string, string | number | Date>>((prev, [key, value]) => {
          if(typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
            return {
              ...prev,
              [key]: value
            }
          }

          return prev
        }, {})
        
        return t(`form.errorMessages.${message.schema.type}.${message.customCode}`, messageArgs)
      }
    })
  })
  const onSubmit = (data: any) => console.log(data)

  console.log(watch("firstName")) // watch input value by passing the name of it

  return (
    /* "handleSubmit" will validate your inputs before invoking "onSubmit" */
    <form onSubmit={handleSubmit(onSubmit)}>
      <h1>{t('HomePage.title')}</h1>
     <input {...register("firstName")} />
      <p>{errors.firstName?.message}</p>

      <input type="number" {...register("age")} />
      <p>{errors.age?.message}</p>

      <input {...register("sure")} />
      <p>{errors.sure?.message}</p>

      <input type="submit" />
    </form>
  )
}
