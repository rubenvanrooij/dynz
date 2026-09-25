import { act, cleanup, renderHook } from "@testing-library/react";
import { array, boolean, discriminatedUnion, eq, number, object, options, ref, string } from "dynz";
import type { ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { afterEach, describe, expect, it } from "vitest";
import { renderDynzHook } from "../testing/render-with-form";
import { useDynzField } from "./use-dynz-field";

const schema = object({
  plan: options(["free", "enterprise"] as const),
  companyName: string()
    .min(3)
    .setIncluded(eq(ref("plan"), "enterprise")),
  slug: string().setMutable(false),
  address: object({ zip: string().min(4) }),
});

const enterpriseValues = { plan: "enterprise" as const, slug: "abc", address: { zip: "1234" } };
const freeValues = { plan: "free" as const, slug: "a", address: { zip: "1234" } };

afterEach(cleanup);

describe("useDynzField", () => {
  it("wires field/fieldState/formState from useController", () => {
    const { result } = renderDynzHook(schema, enterpriseValues, () => useDynzField("companyName"));

    expect(result.current.field.name).toBe("companyName");
    expect(result.current.field.value).toBeUndefined();
    expect(result.current.fieldState).toBeDefined();
    expect(result.current.formState).toBeDefined();
  });

  it("updates the form when field.onChange is called", async () => {
    const { result, form } = renderDynzHook(schema, enterpriseValues, () => useDynzField("companyName"));

    await act(async () => {
      await result.current.field.onChange("Acme");
    });

    expect(form.getValues().companyName).toBe("Acme");
  });

  it("resolves a nested field's own schema", () => {
    const { result } = renderDynzHook(schema, enterpriseValues, () => useDynzField("address.zip"));

    expect(result.current.schema.type).toBe("string");
  });

  it("exposes included, and keeps it reactive to the controlling field", () => {
    const { result, form } = renderDynzHook(schema, enterpriseValues, () => useDynzField("companyName"));

    expect(result.current.included).toBe(true);

    act(() => form.setValue("plan", "free"));

    expect(result.current.included).toBe(false);
  });

  it("marks a field read only only when mutable resolves to exactly false", () => {
    const { result: immutable } = renderDynzHook(schema, freeValues, () => useDynzField("slug"));
    const { result: mutable } = renderDynzHook(schema, freeValues, () => useDynzField("address.zip"));

    expect(immutable.current.readOnly).toBe(true);
    expect(mutable.current.readOnly).toBe(false);
  });

  it("treats an unresolved included state as not included, matching <IsIncluded>", () => {
    const conditional = object({
      trigger: boolean().optional(),
      dependent: string().setIncluded(eq(ref("trigger"), true)),
    });

    const { result } = renderDynzHook(conditional, {}, () => useDynzField("dependent"));

    expect(result.current.included).toBe(false);
  });

  it("throws when used inside a plain react-hook-form that wasn't set up with dynz", () => {
    function Wrapper({ children }: { children: ReactNode }) {
      const methods = useForm();
      return <FormProvider {...methods}>{children}</FormProvider>;
    }

    expect(() => renderHook(() => useDynzField("companyName"), { wrapper: Wrapper })).toThrow(/dynz/i);
  });
});

describe("useDynzField with an array of discriminated unions", () => {
  // Both variants declare `amount` with different schemas — the shape that resolved to
  // whichever variant happened to be declared first.
  const expenseSchema = object({
    items: array(
      discriminatedUnion("kind", [
        { kind: "hours", amount: number() },
        { kind: "money", amount: string() },
      ])
    ),
  });

  const values = {
    items: [
      { kind: "money" as const, amount: "10" },
      { kind: "hours" as const, amount: 2 },
    ],
  };

  it("resolves each element against its own variant", () => {
    const { result: first } = renderDynzHook(expenseSchema, values, () => useDynzField("items.0.amount"));
    const { result: second } = renderDynzHook(expenseSchema, values, () => useDynzField("items.1.amount"));

    expect(first.current.schema.type).toBe("string");
    expect(second.current.schema.type).toBe("number");
  });

  it("resolves via the schema's own default when the document omits the discriminator", () => {
    // useDynzForm does not seed react-hook-form's defaultValues from schema defaults, so
    // getValues() genuinely has no discriminator here — the withDefault threading inside
    // findSchemaByPath is the only thing that resolves this.
    const defaulted = object({
      expense: discriminatedUnion("kind", [
        { kind: "hours", amount: number() },
        { kind: "money", amount: string() },
      ]).setDefault({ kind: "money" }),
    });

    const { result } = renderDynzHook(defaulted, {}, () => useDynzField("expense.amount"));

    expect(result.current.schema.type).toBe("string");
  });

  it("follows the discriminator when it changes", () => {
    const { result, form } = renderDynzHook(expenseSchema, values, () => useDynzField("items.0.amount"));

    expect(result.current.schema.type).toBe("string");

    act(() => form.setValue("items.0.kind", "hours"));

    expect(result.current.schema.type).toBe("number");
  });
});
