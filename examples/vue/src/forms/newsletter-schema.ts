import { boolean, eq, neq, object, options, ref, string } from "dynz";

/**
 * One schema, four kinds of dynamic behaviour — all of it data, none of it code:
 *
 * - `roleDetails.included`  — the field only exists while `role` is "other"
 * - `company.required`      — always visible, only mandatory for product-news subscribers
 * - `companySize.included`  — appears alongside `company` for product-news subscribers
 * - `format` options        — the digest option disables itself for daily subscribers
 *
 * The same schema is what a backend would validate against, and it survives a JSON
 * round trip.
 */
export const newsletterSchema = object({
  email: string().min(1, "required").email(),
  name: string().min(2),

  frequency: options(["daily", "weekly", "monthly"]).setDefault("weekly"),
  format: options(["html", "plain text", { value: "digest", enabled: neq(ref("frequency"), "daily") }]).setDefault(
    "html"
  ),

  role: options(["developer", "designer", "product manager", "other"]),
  roleDetails: string()
    .min(2)
    .setIncluded(eq(ref("role"), "other")),

  wantsProductNews: boolean().setDefault(false),
  company: string()
    .min(2)
    .setRequired(eq(ref("wantsProductNews"), true)),
  companySize: options(["1–10", "11–50", "51–200", "200+"]).setIncluded(eq(ref("wantsProductNews"), true)),
});
