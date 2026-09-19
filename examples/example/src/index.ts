import * as d from "dynz";

// runExample();

async function example() {
  const schema = d
    .object({
      name: d.object({
        first: d.string().setDefault("jan"),
        last: d.string().setIncluded(d.eq(d.ref('first'), 'jan')).setRequired(false).setDefault("naam"),
      }),
      nameSize: d.expr(d.sum(d.size(d.ref("name.first")), d.size(d.ref("name.last")))),
    })
  const result = await d.validate(schema, undefined, undefined);

  console.log(result);
}

example().then(() => console.log("done"));
