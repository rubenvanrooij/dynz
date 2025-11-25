"use client";

import { eq, equals, object, ref, type Schema, string } from "dynz";
import { DynzForm } from "@/components/dynz/form";
import { DynzInput } from "@/components/dynz/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const FIELD_COUNT = 10;

const schema = object({
  fields: Array.apply(null, Array(FIELD_COUNT)).reduce<Record<string, Schema>>((prev, _, index) => {
    prev[`field_${index}`] = string({
      rules: index > 0 ? [equals(ref(`field_${index - 1}`))] : [],
      included: index > 1 ? eq(`field_${index - 1}`, "aa") : true,
    });
    return prev;
  }, {}),
});

export default function Page() {
  return (
    <Card className="flex flex-col gap-4 max-w-100">
      <CardContent className="gap-2">
        <DynzForm name="loginForm" schema={schema}>
          {Array.apply(null, Array(FIELD_COUNT)).map((_, index) => (
            <DynzInput name={`field_${index}`} type="text" />
          ))}

          <Button type="submit">Submit</Button>
        </DynzForm>
      </CardContent>
    </Card>
  );
}
