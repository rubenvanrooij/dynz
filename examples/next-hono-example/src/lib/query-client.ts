import { QueryClient } from "@tanstack/react-query";

/**
 * One cache for the browser. Lookups stay fresh for five minutes, so a plate typed again is
 * answered from the cache.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60_000, retry: false },
  },
});
