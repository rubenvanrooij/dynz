import { flushPromises, mount } from "@vue/test-utils";
import { eq, object, options, ref, string } from "dynz";
import { describe, expect, it } from "vitest";
import { type VNode, defineComponent, h } from "vue";
import { useDynzForm } from "../composables";
import type { DynzFieldSlotProps } from "./dynz-field";
import { DynzField } from "./dynz-field";
import { IsIncluded } from "./is-included";
import { When } from "./when";

const schema = object({
  plan: options(["free", "enterprise"] as const),
  companyName: string()
    .min(3)
    .setIncluded(eq(ref("plan"), "enterprise")),
  slug: string().setMutable(false),
});

/**
 * Mounts a parent that owns the form and a child that consumes it, which is the only
 * arrangement that exercises `provide`/`inject` the way an application does.
 */
function mountForm(children: () => VNode[], initialValues: Record<string, unknown> = { plan: "enterprise" }) {
  let form: ReturnType<typeof useDynzForm<typeof schema>> | undefined;

  const wrapper = mount(
    defineComponent({
      setup() {
        form = useDynzForm({ schema, initialValues, mode: "onInput" });
        return () => h("form", children());
      },
    })
  );

  return { wrapper, form: form as NonNullable<typeof form> };
}

describe("DynzField", () => {
  it("renders its slot with the resolved field state", () => {
    const { wrapper } = mountForm(() => [
      h(
        DynzField,
        { name: "companyName" },
        { default: (slot: DynzFieldSlotProps) => h("input", { value: slot.value }) }
      ),
    ]);

    expect(wrapper.find("input").exists()).toBe(true);
  });

  it("renders nothing while the field is excluded", async () => {
    const { wrapper, form } = mountForm(() => [h(DynzField, { name: "companyName" }, { default: () => h("input") })], {
      plan: "free",
    });

    expect(wrapper.find("input").exists()).toBe(false);

    form.values.plan = "enterprise";
    await flushPromises();

    expect(wrapper.find("input").exists()).toBe(true);
  });

  it("still renders an excluded field when asked to", () => {
    const { wrapper } = mountForm(
      () => [h(DynzField, { name: "companyName", renderWhenExcluded: true }, { default: () => h("input") })],
      { plan: "free" }
    );

    expect(wrapper.find("input").exists()).toBe(true);
  });

  it("collapses the tri-state for the slot but keeps it available under raw", () => {
    let slotProps: DynzFieldSlotProps | undefined;

    mountForm(() => [
      h(
        DynzField,
        { name: "slug" },
        {
          default: (props: DynzFieldSlotProps) => {
            slotProps = props;
            return h("input");
          },
        }
      ),
    ]);

    expect(slotProps?.readOnly).toBe(true);
    expect(slotProps?.required).toBe(true);
    expect(slotProps?.raw).toEqual({ required: true, included: true, mutable: false });
  });

  it("writes back through the slot handlers and surfaces the error", async () => {
    const { wrapper, form } = mountForm(() => [
      h(
        DynzField,
        { name: "companyName" },
        {
          default: (slot: DynzFieldSlotProps) => [
            h("input", { value: slot.value, onInput: slot.onInput, onBlur: slot.onBlur }),
            slot.error === undefined ? null : h("span", { class: "error" }, slot.error),
          ],
        }
      ),
    ]);

    await wrapper.find("input").setValue("no");
    await flushPromises();

    expect(form.values.companyName).toBe("no");
    expect(wrapper.find(".error").exists()).toBe(true);

    await wrapper.find("input").setValue("Acme");
    await flushPromises();

    expect(wrapper.find(".error").exists()).toBe(false);
  });
});

describe("IsIncluded", () => {
  it("renders its slot only while the field is included", async () => {
    const { wrapper, form } = mountForm(
      () => [h(IsIncluded, { name: "companyName" }, { default: () => h("p", "included") })],
      { plan: "free" }
    );

    expect(wrapper.text()).toBe("");

    form.values.plan = "enterprise";
    await flushPromises();

    expect(wrapper.text()).toBe("included");
  });
});

describe("When", () => {
  it("renders its slot only while the predicate holds", async () => {
    const { wrapper, form } = mountForm(
      () => [h(When, { cond: eq(ref("plan"), "enterprise") }, { default: () => h("p", "enterprise") })],
      { plan: "free" }
    );

    expect(wrapper.text()).toBe("");

    form.values.plan = "enterprise";
    await flushPromises();

    expect(wrapper.text()).toBe("enterprise");
  });
});
