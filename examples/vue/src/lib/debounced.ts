import type { ResourceResolver } from "dynz";

/**
 * Waits `ms` before looking a key up, for keys that change on every keystroke. The form
 * aborts `signal` once the key is no longer current, so only the last key is looked up.
 */
export function debounced(ms: number, resolver: ResourceResolver): ResourceResolver {
  return async (key, resource) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
    resource.signal.throwIfAborted();
    return resolver(key, resource);
  };
}
