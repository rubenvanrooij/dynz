"use client";

import { object, ref, string } from "dynz";
import { DynzForm } from "@/components/dynz/form";
import { DynzInput } from "@/components/dynz/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const schema = object({
  password: string(),
  confirmPassword: string().equals(ref("password")),
});

export default function Home() {
  return (
    <Card className="flex flex-col gap-4 max-w-100">
      <CardContent className="gap-2">
        <DynzForm name="loginForm" schema={schema}>
          <DynzInput name="password" type="text" />
          <DynzInput name="confirmPassword" type="text" />
          <Button type="submit">Submit</Button>
        </DynzForm>
      </CardContent>
    </Card>
  );
}
