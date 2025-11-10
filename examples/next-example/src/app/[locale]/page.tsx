"use client";

import { IsIncluded } from "@dynz/react-hook-form";
import type { SchemaValues } from "dynz";
import { boolean, conditional, email, eq, matches, minLength, object, options, or, regex, string } from "dynz";
import { PopcornIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { DynzBoolean, DynzSelect, DynzTextInput } from "@/components/dynz/dynz-form";
import { DynzForm } from "@/components/dynz/form";
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
    company: string({
      rules: [stringRequiredRule],
    }),
    email: string({
      rules: [
        stringRequiredRule,
        email(),
        conditional({
          when: matches("company", "\\bapple\\b", "i"),
          then: regex("@apple.com$", "useCompanyMail"),
        }),
        conditional({
          when: matches("company", "\\microsoft\\b", "i"),
          then: regex("@microsoft.com$", "useCompanyMail"),
        }),
      ],
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
      options: ["AI & Machine Learning", "Web Development", "Data Science", "Cybersecurity"],
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

const DEFAULT_VALUES = {
  name: "",
  email: "",
  company: "",
};

export default function Home() {
  const t = useTranslations();

  const onSubmit = (data: SchemaValues<typeof schema>) => {
    alert(JSON.stringify(data));
  };

  console.log("huh?..");
  return (
    <Card className="flex flex-col gap-4 max-w-100">
      <CardHeader>
        <CardTitle>{t("HomePage.title")}</CardTitle>
      </CardHeader>
      <CardContent className="gap-2">
        <DynzForm
          name="registrationForm"
          schema={schema}
          defaultValues={DEFAULT_VALUES}
          onSubmit={onSubmit}
        >
          <div className="flex flex-col gap-4">
            <DynzTextInput i18nPath="registrationForm" name="name" />
            <DynzTextInput i18nPath="registrationForm" name="company" />
            <DynzTextInput i18nPath="registrationForm" name="email" />
            <DynzSelect i18nPath="registrationForm" name="attendanceType" />
            <DynzBoolean i18nPath="registrationForm" name="accomidationRequired" />
            <DynzSelect i18nPath="registrationForm" name="workshopPreferences" />
            <DynzBoolean i18nPath="registrationForm" name="dietry.restrictions" />
            <DynzTextInput i18nPath="registrationForm" name="dietry.details" />
            <IsIncluded name="dietry.details">
              <Alert>
                <PopcornIcon />
                <AlertTitle>We will do our best to provide food from which you won&apos;t die</AlertTitle>
              </Alert>
            </IsIncluded>
            <DynzSelect i18nPath="registrationForm" name="professionalLevel" />
            <DynzTextInput i18nPath="registrationForm" name="studentInstitution" />
            <Button type="submit">Submit</Button>
          </div>
        </DynzForm>
      </CardContent>
    </Card>
  );
}
