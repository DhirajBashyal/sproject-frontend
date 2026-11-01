import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readStoredTokens, useAuthStore } from "@/stores/auth.store";
import { authApi } from "../api/auth.api";

export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: authApi.me, staleTime: Infinity });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const tokens = readStoredTokens();
      if (tokens) await authApi.logout(tokens.refresh_token);
    },
    // Sign out locally even if the server call fails.
    onSettled: () => {
      useAuthStore.getState().setTokens(null);
      queryClient.clear();
    },
  });
}
