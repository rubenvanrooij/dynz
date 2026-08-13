import { flushPromises, mount } from "@vue/test-utils";
import { eq, object, options, ref, string } from "dynz";
import { useForm } from "vee-validate";
import { describe, expect, it } from "vitest";
import { type ComputedRef, type VNode, defineComponent, h } from "vue";
import { useIsIncluded, useIsRequired } from "../composables";
import { provideDynzContext } from "../context";
import { dynzTypedSchema } from "./dynz-typed-schema";

/**
 * The VeeValidate flavour: VeeValidate owns the form state, dynz owns validation and
 * the conditions. Verified against the real library rather than a stub, because the
 * typed-schema shape is the one contract this package does not control.
 */

const schema = object({
  plan: options(["free", "enterprise"] as const),
  companyName: string()
    .min(3)
    .setIncluded(eq(ref("plan"), "enterprise")),
  vatNumber: string().setRequired(eq(ref("plan"), "enterprise")),
});

function mountVeeForm(children: () => VNode[]) {
  let form: ReturnType<typeof useForm> | undefined;

  const wrapper = mount(
    defineComponent({
      setup() {
        form = useForm({
          validationSchema: dynzTypedSchema(schema),
          initialValues: { plan: "free" },
        });

        provideDynzContext({ schema, getValues: () => form?.values });

        return () => h("form", children());
      },
    })
  );

  return { wrapper, form: form as NonNullable<typeof form> };
}

describe("dynzTypedSchema with vee-validate", () => {
  it("surfaces dynz errors as VeeValidate field errors", async () => {
    const { form } = mountVeeForm(() => []);

    await form.setFieldValue("plan", "enterprise");
    await form.setFieldValue("companyName", "no");
    await form.validate();

    expect(form.errors.value.companyName).toBeDefined();
  });

  it("reports no errors for a valid document", async () => {
    const { form } = mountVeeForm(() => []);

    await form.setFieldValue("companyName", undefined);
    const result = await form.validate();

    expect(result.valid).toBe(true);
  });

  it("keeps the condition composables in sync with VeeValidate's reactive values", async () => {
    let included: ComputedRef<boolean | undefined> | undefined;
    let required: ComputedRef<boolean | undefined> | undefined;

    const child = defineComponent({
      setup() {
        included = useIsIncluded("companyName");
        required = useIsRequired("vatNumber");
        return () => null;
      },
    });

    const { form } = mountVeeForm(() => [h(child)]);

    expect(included?.value).toBe(false);
    expect(required?.value).toBe(false);

    await form.setFieldValue("plan", "enterprise");
    await flushPromises();

    expect(included?.value).toBe(true);
    expect(required?.value).toBe(true);
  });
});
