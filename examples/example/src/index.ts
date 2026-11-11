import * as d from "dynz";

// runExample();

const schema = d
  .object({
    numberOfProducts: d.number(),
    howMuchOfEach: d.number(),

    total: d.expr(d.sum(d.ref("numberOfProducts"), d.ref("howMuchOfEach"))),
  })
  .setResources({
    address,
  });

const result = await d.validate(schema, undefined, {
  numberOfProducts: 3,
  howMuchOfEach: 4,
});

async function example() {
  const schema = d
    .object({
      name: d.object({
        first: d.string().setDefault("jan"),
        last: d.string().setRequired(false).setDefault("naam"),
      }),
      nameSize: d.expr(d.sum(d.size(d.ref("name.first")), d.size(d.ref("name.last")))),
    })
    .setDefault({
      name: { first: "kees" },
    });
  const result = await d.validate(schema, undefined, undefined);

  console.log(result);
}

example().then(() => console.log("done"));
