import { toast } from "sonner";
import { toApiError } from "./axios";

export { toast };

/** Shows the server's or Meta's reason, so the toast says what to fix. */
export function toastError(error: unknown, title?: string) {
  const { detail } = toApiError(error);
  if (title) toast.error(title, { description: detail });
  else toast.error(detail);
}

export const RATE_LIMIT_TOAST_ID = "rate-limit";
