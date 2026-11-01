import { useQuery } from "@tanstack/react-query";
import { inboxApi, inboxAvailable } from "../api/inbox.api";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: inboxApi.conversations,
    enabled: inboxAvailable,
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => inboxApi.messages(conversationId),
    enabled: inboxAvailable,
  });
}
