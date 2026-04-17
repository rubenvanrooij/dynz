import * as d from "dynz";

async function runExample() {
  const schema = d.object({
    quantity: d.number().min(1).maxPrecision(0),
    unitPrice: d.number().min(0).maxPrecision(2),

    // Max discount based on order value:
    // - Base: 5%
    // - +1% per 10 items (max +10%)
    // - +1% per €100 subtotal (max +10%)
    // So max possible discount = 5 + 10 + 10 = 25%
    discount: d
      .number()
      .min(0)
      .max(
        d.sum(
          5, // base 5%
          d.min(d.divide(d.ref("quantity"), 10), 10), // +1% per 10 items, cap 10%
          d.min(d.divide(d.multiply(d.ref("quantity"), d.ref("unitPrice")), 100), 10) // +1% per €100, cap 10%
        )
      ),

    // Subtotal must equal quantity * unitPrice
    subtotal: d.expr(d.multiply(d.ref("quantity"), d.ref("unitPrice"))),

    // Discount amount = subtotal * (discount / 100)
    discountAmount: d.expr(d.multiply(d.ref("subtotal"), d.divide(d.ref("discount"), 100))),

    // Total = subtotal - discountAmount
    total: d.expr(d.sub(d.ref("subtotal"), d.ref("discountAmount"))),
  });

  const values = {
    quantity: 5,
    unitPrice: 100,
    discount: 10,
  };

  const result = await d.validate(schema, undefined, values);

  console.log("schema", d.serialize(schema));
  console.log("result: ", result);

  const maxDiscountFunction = schema.fields.discount.rules[1].max;

  const maxDiscount = d.resolveFunction(maxDiscountFunction, "$", {
    schema: schema,
    values: {
      quantity: 3,
      unitPrice: 100,
      discount: 100,
    },
  });

  console.log("resolved:", maxDiscount);
}

runExample();
