import * as d from "dynz";

const { global, values } = d.createGlobals({
  min: d.SchemaType.NUMBER,
  now: d.SchemaType.DATE,
});

async function example() {
  const schema = d
    .object({
      name: d.object({
        first: d.string().min(global("min")).setDefault("jan"),
        last: d.string().setRequired(false).setDefault("naam"),
      }),
      birthDate: d.date().min(global("now")).setDefault(new Date("2020")),
      nameSize: d.expr(d.sum(d.size(d.ref("name.first")), d.size(d.ref("name.last")))),
    })
    .setDefault({
      name: { first: "kees" },
    });
  const result = await d.validate(schema, undefined, undefined, {
    globals: values({
      min: 4,
      now: new Date("2019"),
    }),
  });

  console.log(result);
}

example().then(() => console.log("done"));
