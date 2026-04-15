"use client";

import { IsIncluded } from "@dynz/react-hook-form";

import { boolean, conditional, eq, matches, object, options, or, ref, type SchemaValues, string, v } from "dynz";
import { PopcornIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { DynzBoolean, DynzSelect, DynzTextInput } from "@/components/dynz/dynz-form";
import { DynzForm } from "@/components/dynz/form";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const schema = object({
  name: string().min(1, "required").min(3),
  company: string().min(1, "required"),
  email: string()
    .min(1, "required")
    .email()
    .when(matches(ref("company"), v("\\bapple\\b"), "i"), (b) => b.regex("@apple.com$", undefined, "useCompanyMail"))
    .when(matches(ref("company"), v("\\bmicrosoft\\b"), "i"), (b) =>
      b.regex("@microsoft.com$", undefined, "useCompanyMail")
    ),
  attendanceType: options(["In-Person", "Virtual", "Hybrid"]).setDefault("Virtual"),
  accomidationRequired: boolean()
    .setCoerce(true)
    .setIncluded(eq(ref("attendanceType"), v("In-Person"))),
  workshopPreferences: options([
    "AI & Machine Learning",
    "Web Development",
    "Data Science",
    "Cybersecurity",
  ]).setIncluded(or(eq(ref("attendanceType"), v("In-Person")), eq(ref("attendanceType"), v("Hybrid")))),
  dietry: object({
    restrictions: boolean().setCoerce(true),
    details: string()
      .min(1, "required")
      .setIncluded(eq(ref("$.dietry.restrictions"), v(true))),
  }),
  professionalLevel: options(["Student", "Junior Professional", "Senior Professional", "Executive"]),
  studentInstitution: string()
    .min(1, "required")
    .setIncluded(eq(ref("professionalLevel"), v("Student"))),
}).setPrivate(false);

console.log(JSON.stringify(schema));

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
