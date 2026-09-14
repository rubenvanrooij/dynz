import { eq, object, options, ref, string } from "dynz";
import { describe, expect, it } from "vitest";
import { renderDynzUi } from "../testing/render-with-form";
import { DynzField } from "./dynz-field";

const schema = object({
  plan: options(["free", "enterprise"] as const),
  companyName: string().setIncluded(eq(ref("plan"), "enterprise")),
});

describe("DynzField", () => {
  it("renders null when the field is not included", () => {
    const { container } = renderDynzUi(
      schema,
      { plan: "free" },
      <DynzField name="companyName" render={({ field }) => <input aria-label="companyName" {...field} />} />
    );

    expect(container.querySelector("input")).toBeNull();
  });

  it("renders the render prop's output when included", () => {
    const { getByLabelText } = renderDynzUi(
      schema,
      { plan: "enterprise" },
      <DynzField name="companyName" render={({ field }) => <input aria-label="companyName" {...field} />} />
    );

    expect(getByLabelText("companyName")).toBeInstanceOf(HTMLInputElement);
  });

  it("passes required/readOnly/schema through to the render prop", () => {
    let seen: { required: boolean; readOnly: boolean; schemaType: string } | undefined;

    renderDynzUi(
      schema,
      { plan: "enterprise" },
      <DynzField
        name="companyName"
        render={({ required, readOnly, schema: fieldSchema, field }) => {
          seen = { required, readOnly, schemaType: fieldSchema.type };
          return <input {...field} />;
        }}
      />
    );

    expect(seen).toEqual({ required: true, readOnly: false, schemaType: "string" });
  });
});
