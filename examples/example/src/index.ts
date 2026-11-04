import * as d from "dynz";

// runExample();

const schema = d.discriminatedUnion("kind", [
  {
    kind: "card",
    last4: d.string(),
  },
  {
    kind: "bank",
    iban: d.string(),
  },
]);

async function example() {
  const schema = d
    .object({
      name: d.object({
        first: d.string().setDefault("jan"),
        last: d.string().setRequired(false).setDefault("naam"),
      }),
      nameSize: d.expr(d.sum(d.size(d.ref("name.first")), d.size(d.ref("name.last")))),
    })
  // .setDefault({
  //   name: { first: "kees" },
  // });

  const a = d.standardSchema(schema, {
    currentValues: undefined,                               // enables mutability enforcement
    customRules: { passwordStrength: () => false },
    messageTransformer: (error) => "foo", // defaults to error.message
  })

  const result = await a['~standard'].validate(undefined)


  console.log(result);
}

example().then(() => console.log("done"));
