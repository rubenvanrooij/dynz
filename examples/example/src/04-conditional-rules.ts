import * as d from "dynz";

async function runExample() {
  const schema = d.object({
    country: d.options(["US", "CA", "UK", "NL"]),
    postalCode: d
      .string()
      // Different validation per country
      .when(d.eq(d.ref("country"), "US"), (s) => s.regex(`^\\d{5}(-\\d{4})?$`))
      .when(d.eq(d.ref("country"), "CA"), (s) => s.regex(`^[A-Z]\\d[A-Z]\\s?\\d[A-Z]\\d$`))
      .when(d.eq(d.ref("country"), "NL"), (s) => s.regex(`^[1-9]\\d{3}\\s?[A-Z]{2}$`))
      .custom("postalCodeCheck", {
        country: d.ref("country"),
      }),
  });

  const result = await d.validate(
    schema,
    undefined,
    {
      country: "NL",
      postalCode: "1234B", // US = 12345  // CA = K1A0B1
    },
    {
      customRules: {
        postalCodeCheck: validatePostalCode,
      },
    }
  );

  console.log("result: ", result);
}

async function validatePostalCode({ value }: d.SchemaWithValue<d.Schema>, params: Record<string, unknown>) {
  console.log("running custom rule: validatePostalCode");

  if (value === "1234AB" && params.country === "NL") {
    return false;
  }

  return true;
}

runExample();
