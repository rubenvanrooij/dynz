import { act, cleanup, renderHook } from "@testing-library/react";
import { boolean, eq, object, options, ref, string } from "dynz";
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
