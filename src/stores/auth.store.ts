import { create } from "zustand";
import { AUTH_STORAGE_KEY } from "@/lib/constants";
import type { TokenPair } from "@/types/api.types";

export function readStoredTokens(): TokenPair | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as TokenPair) : null;
}

interface AuthState {
  tokens: TokenPair | null;
  setTokens: (tokens: TokenPair | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  tokens: readStoredTokens(),
  setTokens: (tokens) => {
    if (tokens) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
    else localStorage.removeItem(AUTH_STORAGE_KEY);
    set({ tokens });
  },
}));

// `storage` fires in the other tabs, so logging out in one logs out all of them.
window.addEventListener("storage", (event) => {
  if (event.key === AUTH_STORAGE_KEY) useAuthStore.setState({ tokens: readStoredTokens() });
});
