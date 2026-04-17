import * as d from "dynz";

async function runExample() {

    const schema = d.object({
        status: d.options(["employed", "self-employed", "unemployed"]),
        // Only included when employed
        employerName: d.string()
            .min(2)
            .setIncluded(d.eq(d.ref("status"), "employed")),

        // Only included when self-employed
        businessName: d.string()
            .min(2)
            .setIncluded(d.eq(d.ref("status"), "self-employed")),
    });

    // Try changing confirmPassword to not match!
    const result = await d.validate(schema, undefined, {
        status: "employed",
        employerName: "secretpass123",
    });

    console.log("result: ", result);
}

runExample()
