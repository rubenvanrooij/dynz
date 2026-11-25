import type { ResourceResolvers, ResourceState } from "dynz";
import { debounced } from "../lib/debounced";
import type { CompanyInfo } from "./newsletter-schema";

/**
 * How the schema's resources are looked up: the form calls these for every enabled instance,
 * once per key, and its conditions, UI and validation all read the results. In a real app this
 * would call an API; here it is a mock with a delay, so the pending state is visible.
 */
export const newsletterResolvers: ResourceResolvers = {
  // the key is the company name, so every keystroke is a new key: wait for the user to stop
  // typing. A failure becomes an outcome the schema handles, so the form never blocks on it.
  company: debounced(300, (name) => findCompany(String(name)).catch((): ResourceState => ({ outcome: "failed" }))),
};

const COMPANIES: Record<string, CompanyInfo> = {
  "acme inc.": { name: "Acme Inc.", size: "51–200" },
  "flaky co.": { name: "Flaky Co.", size: "11–50" },
};

/** "Flaky Co." fails every other attempt, to show the retry. */
let flakyAttempts = 0;

async function findCompany(name: string): Promise<ResourceState<CompanyInfo>> {
  await delay(300);
  const id = name.trim().toLowerCase();

  if (id === "flaky co." && flakyAttempts++ % 2 === 0) {
    throw new Error("The company registry is unavailable");
  }

  const company = COMPANIES[id];

  return company ? { outcome: "found", data: company } : { outcome: "not_found" };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
