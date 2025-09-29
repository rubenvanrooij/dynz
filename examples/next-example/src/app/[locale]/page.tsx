"use client";

import type { SchemaValues } from "dynz";
import { boolean, conditional, email, eq, equals, minLength, object, options, or, string } from "dynz";
import { PopcornIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { DynzBoolean, DynzForm, DynzIncludedWrapper, DynzSelect, DynzTextInput } from "@/components/dynz/dynz-form";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stringRequiredRule = minLength(1, "required");

const schema = object({
  private: false,
  fields: {
    name: string({
      rules: [stringRequiredRule, minLength(3)],
    }),
    email: string({
      rules: [stringRequiredRule, email()],
    }),
    attendanceType: options({
      default: "Virtual",
      options: ["In-Person", "Virtual", "Hybrid"],
    }),
    accomidationRequired: boolean({
      coerce: true,
      included: eq("attendanceType", "In-Person"),
    }),
    workshopPreferences: options({
      options: ["AI & Machine Learning", "Web Development", "Data Science", "Cybersecurity", "PHP"],
      rules: [
        conditional({
          when: eq("name", "Niek"),
          then: equals("PHP", "nieks_php_rule"),
        }),
      ],
      included: or(eq("attendanceType", "In-Person"), eq("attendanceType", "Hybrid")),
    }),
    dietry: object({
      fields: {
        restrictions: boolean({
          coerce: true,
        }),
        details: string({
          rules: [stringRequiredRule],
          included: eq("$.dietry.restrictions", true),
        }),
      },
    }),
    professionalLevel: options({
      options: ["Student", "Junior Professional", "Senior Professional", "Executive"],
    }),
    studentInstitution: string({
      rules: [stringRequiredRule],
      included: eq("professionalLevel", "Student"),
    }),
    // image: array({
    //   schema: file({
    //     rules: [mimeType(['image/jpeg', 'text/csv'])]
    //   }),
    //   rules: [min(1), max(1)]
    // })
  },
});

export default function Home() {
  const t = useTranslations();

  const onSubmit = (data: SchemaValues<typeof schema>) => {
    alert(JSON.stringify(data));
  };

  return (
    <Card className="flex flex-col gap-4 max-w-100">
      <CardHeader>
        <CardTitle>{t("HomePage.title")}</CardTitle>
      </CardHeader>
      <CardContent className="gap-2">
        <DynzForm
          name="registrationForm"
          schema={schema}
          defaultValues={{
            name: "",
            email: "",
          }}
          onSubmit={onSubmit}
        >
          <div className="flex flex-col gap-4">
            <DynzTextInput name="name" />
            <DynzTextInput name="email" />
            <DynzSelect name="attendanceType" />
            <DynzBoolean name="accomidationRequired" />
            <DynzSelect name="workshopPreferences" />
            <DynzBoolean name="dietry.restrictions" />
            <DynzTextInput name="dietry.details" />
            <DynzIncludedWrapper name="dietry.details">
              <Alert>
                <PopcornIcon />
                <AlertTitle>We will do our best to provide food from which you won&apos;t die</AlertTitle>
              </Alert>
            </DynzIncludedWrapper>
            <DynzSelect name="professionalLevel" />
            <DynzTextInput name="studentInstitution" />
            <Button type="submit">Submit</Button>
          </div>
        </DynzForm>
      </CardContent>
    </Card>
  );
}
