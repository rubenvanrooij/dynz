"use client";

import { discriminatedUnion, literal, object, ref, string } from "dynz";
import { DynzForm } from "@/components/dynz/form";
import { DynzInput } from "@/components/dynz/input";
import { DynzUnionKey } from "@/components/dynz/union-key";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const schema = object({
  name: string(),
  contactDetails: discriminatedUnion("type", [
    {
      type: "email",
      email: string(),
    },
    {
      type: "phone",
      phone: string(),
    },
  ]),
});

export default function Home() {
  return (
    <Card className="flex flex-col gap-4 max-w-100">
      <CardContent className="gap-2">
        <DynzForm name="contactForm" schema={schema}>
          <DynzInput name="name" type="text" />
          <DynzUnionKey name="contactDetails.type" />
           <DynzInput name="contactDetails.email" type="text" />
           <DynzInput name="contactDetails.phone" type="text" />
          <Button type="submit">Submit</Button>
        </DynzForm>
      </CardContent>
    </Card>
  );
}
