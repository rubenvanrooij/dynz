import { QueryClient } from "@tanstack/react-query";

/**
 * One cache for the browser. Lookups stay fresh for five minutes, so a plate typed again is
 * answered from the cache. No retries: a failed lookup shows right away, and the form
 * looks it up again on the next change.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60_000, retry: false },
  },
});
