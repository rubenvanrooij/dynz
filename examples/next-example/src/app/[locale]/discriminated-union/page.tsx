"use client";

import { boolean, discriminatedUnion, eq, object, ref, string, v } from "dynz";
import { DynzCheckbox } from "@/components/dynz/checkbox";
import { DynzForm } from "@/components/dynz/form";
import { DynzInput } from "@/components/dynz/input";
import { DynzUnionKey } from "@/components/dynz/union-key";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// "phone" is a valid contact method only when the user has opted in via
// `allowPhone`. Its discriminator entry is a `DynamicOptionValue` (`{ value, enabled }`)
// instead of a plain string, so the union member itself is enabled/disabled based on
// another field, exactly like an `options()` value.
const schema = object({
  name: string(),
  allowPhone: boolean(),
  contactDetails: discriminatedUnion("type", [
    {
      type: "email",
      email: string(),
    },
    {
      type: { value: "phone", enabled: eq(ref("allowPhone"), v(true)) },
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
          <DynzCheckbox name="allowPhone" />
          <DynzUnionKey name="contactDetails.type" />
          <DynzInput name="contactDetails.email" type="text" />
          <DynzInput name="contactDetails.phone" type="text" />
          <Button type="submit">Submit</Button>
        </DynzForm>
      </CardContent>
    </Card>
  );
}
