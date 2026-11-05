import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import { ApiError } from "@/lib/axios";
import { inboxApi } from "../api/inbox.api";
import type { Conversation, ConversationFilters, ConversationList, Message, MessageList } from "../types";

const POLL_MS = 15_000;
const RATE_LIMITED_POLL_MS = 60_000;

const messagesKey = (conversationId: string) => ["messages", conversationId];

// Writes a changed conversation into every cached list, so no list refetch is needed.
function patchConversation(
  queryClient: QueryClient,
  id: string,
  patch: (conversation: Conversation) => Conversation,
) {
  queryClient.setQueriesData<InfiniteData<ConversationList>>({ queryKey: ["conversations"] }, (data) =>
    data
      ? {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((item) => (item.id === id ? patch(item) : item)),
          })),
        }
      : data,
  );
}

export function useConversations(filters: ConversationFilters) {
  return useInfiniteQuery({
    queryKey: ["conversations", filters],
    queryFn: ({ pageParam }) => inboxApi.conversations(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((count, page) => count + page.items.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
    // The API has no live updates, so poll while the tab is visible.
    refetchInterval: (query) =>
      query.state.error instanceof ApiError && query.state.error.status === 429
        ? RATE_LIMITED_POLL_MS
        : POLL_MS,
    staleTime: 0,
  });
}

export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: messagesKey(conversationId),
    queryFn: ({ pageParam }) => inboxApi.messages(conversationId, pageParam),
    initialPageParam: undefined as string | undefined,
    // Page 0 holds the newest messages; each later page is older.
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.items[0]?.created_at : undefined),
    select: (data) => [...data.pages].reverse().flatMap((page) => page.items),
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inboxApi.markRead,
    onSuccess: (updated) => patchConversation(queryClient, updated.id, () => updated),
  });
}

export function useUpdateConversation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes: Parameters<typeof inboxApi.update>[1]) => inboxApi.update(id, changes),
    onSuccess: (updated) => {
      patchConversation(queryClient, id, () => updated);
      // The conversation may now belong in a different status filter.
      void queryClient.invalidateQueries({ queryKey: ["conversations"], refetchType: "none" });
    },
  });
}

export function addSentMessage(queryClient: QueryClient, message: Message) {
  queryClient.setQueryData<InfiniteData<MessageList>>(messagesKey(message.conversation_id), (data) =>
    data
      ? {
          ...data,
          pages: data.pages.map((page, index) =>
            index === 0 ? { ...page, items: [...page.items, message] } : page,
          ),
        }
      : data,
  );
  patchConversation(queryClient, message.conversation_id, (conversation) => ({
    ...conversation,
    last_message_text: message.text.slice(0, 255),
    last_message_at: message.created_at,
    unread_count: 0,
  }));
}

export function refreshMessages(queryClient: QueryClient, conversationId: string) {
  return queryClient.invalidateQueries({ queryKey: messagesKey(conversationId) });
}
