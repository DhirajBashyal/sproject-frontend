import axios from "axios";
import { env } from "@/config/env";
import { readStoredTokens, useAuthStore } from "@/stores/auth.store";
import type { TokenPair } from "@/types/api.types";

// Separate from the main client, so a failed refresh can't trigger another refresh.
export const refreshClient = axios.create({ baseURL: env.apiBaseUrl });

let refreshing: Promise<string> | null = null;

async function runRefresh(rejectedToken: string) {
  const stored = readStoredTokens();
  if (!stored) throw new Error("Signed out");

  // Another tab refreshed while this one waited for the lock.
  if (stored.access_token !== rejectedToken) {
    useAuthStore.setState({ tokens: stored });
    return stored.access_token;
  }

  try {
    const { data } = await refreshClient.post<TokenPair>("/api/auth/user/refresh", {
      refresh_token: stored.refresh_token,
    });
    useAuthStore.getState().setTokens(data);
    return data.access_token;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().setTokens(null);
    }
    throw error;
  }
}

/**
 * Refresh tokens work once, so one refresh runs at a time across all tabs:
 * `refreshing` joins callers in this tab, the Web Lock queues the other tabs.
 */
export function refreshAccessToken(rejectedToken: string) {
  const run = () => runRefresh(rejectedToken);
  refreshing ??= (navigator.locks ? navigator.locks.request("auth-refresh", run) : run()).finally(
    () => {
      refreshing = null;
    },
  );
  return refreshing;
}
