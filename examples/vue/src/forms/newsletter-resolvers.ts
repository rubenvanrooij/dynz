import type { ResourceResolver, ResourceResolvers, ResourceState } from "dynz";
import type { CompanyInfo } from "./newsletter-schema";

/**
 * How the schema's resources are looked up. In a real app this would call an API; here it is
 * a mock with a delay, so the pending state is visible.
 *
 * Defined once at module level: the form re-runs its lookups when it gets a new object.
 */
export const newsletterResolvers: ResourceResolvers = {
  company: cachedAndDebounced(async (name) => {
    await delay(300);
    const company = COMPANIES[name.trim().toLowerCase()];

    return company ? { outcome: "found", data: company } : { outcome: "not_found" };
  }),
};

const COMPANIES: Record<string, CompanyInfo> = {
  "acme inc.": { name: "Acme Inc.", size: "51–200" },
};

/** What a failed or skipped lookup resolves to: the form then simply asks for the size. */
const FALLBACK: ResourceState = { outcome: "not_found" };

/**
 * Resolvers are called on every key change and again on every validation, so this one is:
 *
 * - **debounced**: the key is the company name, so every keystroke is a new key. Each call waits
 *   `wait` ms and only sends its request if no call for another key came in meanwhile. The form
 *   shows "Looking up…" right away regardless, because its entry turns pending immediately.
 * - **cached** by key, sharing a request that is still running;
 * - **never throwing**: a failed lookup falls back to {@link FALLBACK}.
 *
 * "The latest call wins" assumes one instance of the resource. A resource inside an array has
 * one instance per item, each with its own key; it would need the latest key per instance path
 * (the resolver's second argument).
 */
function cachedAndDebounced(lookup: (key: string) => Promise<ResourceState>, wait = 300): ResourceResolver {
  const cache = new Map<string, Promise<ResourceState>>();
  let latest: string | undefined;

  return (key) => {
    const id = String(key);
    latest = id;

    const hit = cache.get(id);

    if (hit !== undefined) {
      return hit;
    }

    const request = delay(wait)
      .then(() => {
        if (latest !== id) {
          // superseded while waiting: the form no longer has this key and ignores the result,
          // so skip the request, and don't keep the placeholder in the cache
          cache.delete(id);
          return FALLBACK;
        }

        return lookup(id);
      })
      .catch(() => {
        cache.delete(id); // try again on the next call
        return FALLBACK;
      });

    cache.set(id, request);
    return request;
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
