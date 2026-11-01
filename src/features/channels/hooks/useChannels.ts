import { useMutation, useQueries, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { channelsApi } from "../api/channels.api";
import { PLATFORMS, type Channel, type Platform } from "../types";

const listKey = (platform: Platform) => ["channels", platform];

// Writes API responses into the cache, because refetching would spend the rate limit.
export function upsertChannels(queryClient: QueryClient, channels: Channel[]) {
  for (const channel of channels) {
    queryClient.setQueryData<Channel[]>(listKey(channel.platform), (current) => {
      if (!current) return current;
      const exists = current.some((item) => item.external_id === channel.external_id);
      return exists
        ? current.map((item) => (item.external_id === channel.external_id ? channel : item))
        : [...current, channel];
    });
  }
}

export function useChannels(platform: Platform) {
  return useQuery({ queryKey: listKey(platform), queryFn: () => channelsApi.list(platform) });
}

export function useAllChannels() {
  return useQueries({
    queries: PLATFORMS.map((platform) => ({
      queryKey: listKey(platform),
      queryFn: () => channelsApi.list(platform),
    })),
    combine: (results) => ({
      lists: Object.fromEntries(PLATFORMS.map((platform, i) => [platform, results[i]?.data])) as Record<
        Platform,
        Channel[] | undefined
      >,
      isPending: results.some((result) => result.isPending),
      error: results.find((result) => result.error)?.error ?? null,
    }),
  });
}

export function useChannelStatus(channel: Channel, enabled: boolean) {
  return useQuery({
    queryKey: ["channel-status", channel.platform, channel.external_id],
    queryFn: () => channelsApi.status(channel),
    enabled,
    staleTime: 60_000,
  });
}

export function useChannelActions(channel: Channel) {
  const queryClient = useQueryClient();
  const onChannel = (updated: Channel) => {
    upsertChannels(queryClient, [updated]);
    void queryClient.invalidateQueries({
      queryKey: ["channel-status", channel.platform, channel.external_id],
    });
  };

  return {
    reconnect: useMutation({ mutationFn: () => channelsApi.reconnect(channel), onSuccess: onChannel }),
    disconnect: useMutation({ mutationFn: () => channelsApi.disconnect(channel), onSuccess: onChannel }),
    updateToken: useMutation({
      mutationFn: (token: string) => channelsApi.updateToken(channel, token),
      onSuccess: onChannel,
    }),
    remove: useMutation({
      mutationFn: () => channelsApi.remove(channel),
      onSuccess: () =>
        queryClient.setQueryData<Channel[]>(listKey(channel.platform), (current) =>
          current?.filter((item) => item.external_id !== channel.external_id),
        ),
    }),
  };
}

export function useStartOAuth() {
  return useMutation({
    mutationFn: async (platform: "facebook" | "instagram") =>
      platform === "facebook"
        ? (await channelsApi.facebookOAuthUrl()).url
        : (await channelsApi.instagramOAuthConfig()).auth_url,
    onSuccess: (url) => window.location.assign(url),
  });
}
