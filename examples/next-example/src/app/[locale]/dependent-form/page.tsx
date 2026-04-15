"use client";

import { eq, object, ref, type Schema, type StrFluent, string } from "dynz";
import { DynzForm } from "@/components/dynz/form";
import { DynzInput } from "@/components/dynz/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const FIELD_COUNT = 10;

// Use a generic type for dynamic schema building since rules tuple changes
type AnyStrFluent = StrFluent<any, any>;

const schema = object(
  Array.apply(null, Array(FIELD_COUNT)).reduce<Record<string, Schema>>((prev, _, index) => {
    let fieldSchema: AnyStrFluent = string();

    if (index > 0) {
      fieldSchema = fieldSchema.equals(ref(`field_${index - 1}`));
    }

    if (index > 1) {
      fieldSchema = fieldSchema.setIncluded(eq(ref(`field_${index - 1}`), "aa"));
    }

    prev[`field_${index}`] = fieldSchema;
    return prev;
  }, {})
);

export default function Page() {
  return (
    <Card className="flex flex-col gap-4 max-w-100">
      <CardContent className="gap-2">
        <DynzForm name="loginForm" schema={schema}>
          {Array.apply(null, Array(FIELD_COUNT)).map((_, index) => (
            <DynzInput key={`field_${index}`} name={`field_${index}`} type="text" />
          ))}

          <Button type="submit">Submit</Button>
        </DynzForm>
      </CardContent>
    </Card>
  );
}
