import * as d from "dynz";

async function runExample() {

    const stringSchema = d.string().min(1).max(10).optional()

    const result = await d.validate(stringSchema, undefined, '122');

    console.log("result: ", result);
}

runExample()
