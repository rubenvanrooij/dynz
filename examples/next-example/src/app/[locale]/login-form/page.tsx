"use client";

import { equals, object, ref, string } from "dynz";
import { DynzForm } from "@/components/dynz/form";
import { DynzInput } from "@/components/dynz/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const schema = object({
  fields: {
    password: string(),
    confirmPassword: string({
      rules: [equals(ref("password"))],
    }),
  },
});

export default function Home() {
  return (
    <Card className="flex flex-col gap-4 max-w-100">
      <CardContent className="gap-2">
        <DynzForm name="loginForm" schema={schema}>
          <DynzInput i18nPath="loginForm" name="password" type="text" />
          <DynzInput i18nPath="loginForm" name="confirmPassword" type="text" />
          <Button type="submit">Submit</Button>
        </DynzForm>
      </CardContent>
    </Card>
  );
}
