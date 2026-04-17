import * as d from "dynz";

async function runExample() {
    const passwordSchema = d.object({
        password: d.string().min(10),
        confirmPassword: d.string().equals(d.ref("password")),
    });

    // Try changing confirmPassword to not match!
    const result = await d.validate(passwordSchema, undefined, {
        password: "secretpass123",
        confirmPassword: "secretpass123",
    });

    console.log(d.serialize(passwordSchema))

    console.log("result: ", result);
}

runExample();
