"use client";

import { IsIncluded } from "@dynz/react-hook-form";

import * as d from "dynz";
import { PopcornIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { DynzBoolean, DynzSelect, DynzTextInput } from "@/components/dynz/dynz-form";
import { DynzForm } from "@/components/dynz/form";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stringRequiredRule = d.minLength(d.v(1), "required");

const schema = d.object({
  private: false,
  fields: {
    name: d.string({
      rules: [stringRequiredRule, d.minLength(d.v(3))],
    }),
    company: d.string({
      rules: [stringRequiredRule],
    }),
    email: d.string({
      rules: [
        stringRequiredRule,
        d.email(),
        d.conditional({
          when: d.matches(d.ref("company"), d.v("\\bapple\\b"), "i"),
          then: d.regex("@apple.com$", "useCompanyMail"),
        }),
        d.conditional({
          when: d.matches(d.ref("company"), d.v("\\microsoft\\b"), "i"),
          then: d.regex("@microsoft.com$", "useCompanyMail"),
        }),
      ],
    }),
    attendanceType: d.options({
      default: "Virtual",
      options: ["In-Person", "Virtual", "Hybrid"],
    }),
    accomidationRequired: d.boolean({
      coerce: true,
      included: d.eq(d.ref("attendanceType"), d.v("In-Person")),
    }),
    workshopPreferences: d.options({
      options: ["AI & Machine Learning", "Web Development", "Data Science", "Cybersecurity"],
      included: d.or(d.eq(d.ref("attendanceType"), d.v("In-Person")), d.eq(d.ref("attendanceType"), d.v("Hybrid"))),
    }),
    dietry: d.object({
      fields: {
        restrictions: d.boolean({
          coerce: true,
        }),
        details: d.string({
          rules: [stringRequiredRule],
          included: d.eq(d.ref("$.dietry.restrictions"), d.v(true)),
        }),
      },
    }),
    professionalLevel: d.options({
      options: ["Student", "Junior Professional", "Senior Professional", "Executive"],
    }),
    studentInstitution: d.string({
      rules: [stringRequiredRule],
      included: d.eq(d.ref("professionalLevel"), d.v("Student")),
    }),
    // image: array({
    //   schema: file({
    //     rules: [mimeType(['image/jpeg', 'text/csv'])]
    //   }),
    //   rules: [min(1), max(1)]
    // })
  },
});

console.log(JSON.stringify(schema));

const DEFAULT_VALUES = {
  name: "",
  email: "",
  company: "",
};

export default function Home() {
  const t = useTranslations();

  const onSubmit = (data: d.SchemaValues<typeof schema>) => {
    alert(JSON.stringify(data));
  };

  console.log("huh?..");
  return (
    <Card className="flex flex-col gap-4 max-w-100">
      <CardHeader>
        <CardTitle>{t("HomePage.title")}</CardTitle>
      </CardHeader>
      <CardContent className="gap-2">
        <DynzForm name="registrationForm" schema={schema} defaultValues={DEFAULT_VALUES} onSubmit={onSubmit}>
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
