"use client"

import { max, mimeType, min, regex } from 'dynz/rules';
import { eq, or } from 'dynz/conditions';
import { array, boolean, file, object, options, string } from 'dynz/schema';
import { SchemaValues } from "dynz/types";
import { useTranslations } from "next-intl";
import { Form } from "@/form/form";
import { Input } from "@/form/input";
import { Select } from "@/form/select";
import { BooleanField } from "@/form/boolean";

const stringRequiredRule = min(1, 'required')
const emailRule = regex(`^[a-zA-Z0-9.!#$%&'*+/=?^_\`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$`)

const schema = object({
  fields: {
    name: string({
      rules: [stringRequiredRule]
    }),
    email: string({
      rules: [emailRule]
    }),
    attendanceType: options({
      default: "Virtual",
      options: ["In-Person", "Virtual", "Hybrid"],
    }),
    accomidationRequired: boolean({
      included: eq('attendanceType', 'In-Person')
    }),
    workshopPreferences: options({
      options: ["AI & Machine Learning", "Web Development", "Data Science", "Cybersecurity"],
      included: or(
        eq('attendanceType', 'In-Person'),
        eq('attendanceType', 'Hybrid')
      )
    }),
    dietry: object({
      fields: {
        restrictions: boolean(),
        details: string({
          included: eq('restrictions', true)
        })
      }
    }),
    professionalLevel: options({
      options: ["Student", "Junior Professional", "Senior Professional", "Executive"]
    }),
    studentInstitution: string({
      included: eq('professionalLevel', 'Student')
    }),
    image: array({
      schema: file({
        rules: [mimeType(['image/jpeg', 'text/csv'])]
      }),
      rules: [min(1), max(1)]
    })
  },
});

type RegistrionFormFields = SchemaValues<typeof schema>


export default function Home() {

  const t = useTranslations();


  const onSubmit = (data: any) => {
    alert(JSON.stringify(data))
  }


  return (
    <Form schema={schema} defaultValues={{
      attendanceType: undefined
    }} onSubmit={onSubmit}>
      <h1>{t('HomePage.title')}</h1>

      {/* <Input path="firstName" /> */}
      <Input type="string" path="name" />
      <Input type="string" path="email" />
      <Select path="attendanceType" />
      <BooleanField path="accomidationRequired" />
      <BooleanField path="workshopPreferences" />
      <BooleanField path="dietry.restrictions" />
      <Input type="string" path="dietry.details" />
      <Select path="professionalLevel" />
      <Input type="string" path="studentInstitution" />
       <Input type="file" multiple={true} path="image" />
      <button type="submit">Submit</button>
    </Form>
  )
}
