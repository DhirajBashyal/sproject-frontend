import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ApiError } from "@/lib/axios";
import { RATE_LIMIT_TOAST_ID, toast, toastError } from "@/lib/toast";

type ToastMessage = string | ((data: unknown, variables: unknown) => string | null);

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      /** Shown as a success toast. Return null to skip it. */
      successToast?: ToastMessage;
      /** Set false when the page handles the error itself, or the action is silent. */
      errorToast?: false;
    };
  }
}

function rateLimitToast() {
  toast.error("Too many requests", {
    id: RATE_LIMIT_TOAST_ID, // one toast, however many requests hit the limit
    description: "Wait a minute and try again.",
  });
}

// The API allows 5 requests per minute per IP: no background refetching, no retry on 4xx.
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // Loading errors show inline where the data belongs; only the rate limit gets a toast.
    onError: (error) => {
      if (error instanceof ApiError && error.status === 429) rateLimitToast();
    },
  }),
  mutationCache: new MutationCache({
    onSuccess: (data, variables, _context, mutation) => {
      const message = mutation.meta?.successToast;
      const text = typeof message === "function" ? message(data, variables) : message;
      if (text) toast.success(text);
    },
    onError: (error, _variables, _context, mutation) => {
      if (error instanceof ApiError && error.status === 429) return rateLimitToast();
      if (mutation.meta?.errorToast === false) return;
      toastError(error);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: (count, error) => count < 1 && !(error instanceof ApiError && error.status < 500),
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
