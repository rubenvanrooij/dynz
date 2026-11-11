import type { ObjectSchema } from "dynz";
import { pickSchema } from "./pick-schema";
import { vehicleSchema } from "./vehicle-schema";

export type Widget = "short_text" | "number" | "date" | "checkbox" | "dropdown" | "repeater";

export type FunnelConfig = {
  steps: {
    id: string;
    title: string;
    /** What the step asks, and how. */
    fields: { path: string; widget: Widget }[];
    /** Answers of earlier steps the step's conditions read: in its schema, not shown. */
    context: string[];
    /** The resources the step's conditions use, looked up again from its own values. */
    resources: string[];
  }[];
};

/**
 * The web channel. Every step is its own form, with a schema of its fields plus its
 * `context` and `resources`. Trusted as is: a missing context field throws when the step
 * renders, a missing resource silently resolves as `undefined`.
 */
export const FUNNEL = {
  steps: [
    {
      id: "vehicle",
      title: "Your car",
      context: [],
      resources: ["vehicle"],
      fields: [
        { path: "ownership", widget: "dropdown" },
        { path: "plate", widget: "short_text" },
        { path: "vehicleConfirmed", widget: "checkbox" },
        { path: "manualVehicle.make", widget: "short_text" },
        { path: "manualVehicle.model", widget: "short_text" },
        { path: "manualVehicle.year", widget: "number" },
      ],
    },
    {
      id: "driver",
      title: "Policyholder",
      context: ["ownership", "plate"],
      resources: ["vehicle", "claims"],
      fields: [
        { path: "driver.name", widget: "short_text" },
        { path: "driver.birthDate", widget: "date" },
        { path: "driver.licenceNumber", widget: "short_text" },
        { path: "driver.licenceDate", widget: "date" },
        { path: "driver.address.street", widget: "short_text" },
        { path: "driver.address.postcode", widget: "short_text" },
        { path: "driver.address.city", widget: "short_text" },
        { path: "driver.country", widget: "dropdown" },
        { path: "driver.claimFreeYears", widget: "number" },
        { path: "driver.previousInsurer", widget: "short_text" },
        { path: "additionalDrivers", widget: "repeater" },
      ],
    },
    {
      id: "coverage",
      title: "Coverage",
      context: ["ownership", "plate", "manualVehicle.year"],
      resources: ["vehicle"],
      fields: [
        { path: "coverage", widget: "dropdown" },
        { path: "roadsideAssistance", widget: "checkbox" },
      ],
    },
    {
      id: "payment",
      title: "Payment",
      context: ["ownership", "plate", "driver.country"],
      resources: ["vehicle", "paymentOptions"],
      fields: [{ path: "paymentMethod", widget: "dropdown" }],
    },
  ],
} satisfies FunnelConfig;

export type FunnelStep = FunnelConfig["steps"][number] & { schema: ObjectSchema<never> };

export const vehicleFunnel: FunnelStep[] = FUNNEL.steps.map((step) => ({
  ...step,
  schema: pickSchema(
    vehicleSchema,
    [...step.fields.map((field) => field.path), ...step.context],
    step.resources
  ) as ObjectSchema<never>,
}));
