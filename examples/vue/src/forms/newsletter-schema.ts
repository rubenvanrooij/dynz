import { and, boolean, eq, matches, neq, object, options, or, ref, resource, resourceRef, string } from "dynz";

/**
 * One schema, five kinds of dynamic behaviour — all of it data, none of it code:
 *
 * - `roleDetails.included`  — the field only exists while `role` is "other"
 * - `company.required`      — always visible, only mandatory for product-news subscribers
 * - `format` options        — the digest option disables itself for daily subscribers
 * - the `company` resource  — product-news subscribers' company is looked up by name
 * - `companySize.included`  — only asked when that lookup doesn't know the company, or failed
 *
 * The same schema is what a backend would validate against, and it survives a JSON
 * round trip. How the company is looked up is not part of it: see `newsletter-lookups.ts`.
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
  // `eq(…, "not_found")` rather than `neq(…, "found")`: while the lookup is pending the outcome is
  // `undefined`, and the field should stay hidden until we know we need it
  companySize: options(["1–10", "11–50", "51–200", "200+"]).setIncluded(
    and(
      eq(ref("wantsProductNews"), true),
      or(eq(resourceRef("company.outcome"), "not_found"), eq(resourceRef("company.outcome"), "failed"))
    )
  ),
}).setResources({
  company: resource<CompanyInfo>({
    key: ref("company"),
    enabled: and(eq(ref("wantsProductNews"), true), matches(ref("company"), ".{2,}")),
    // `failed`: the lookup could not be done; the form then simply asks for the size
    outcomes: ["found", "not_found", "failed"],
  }),
});

export type CompanyInfo = { name: string; size: string };
