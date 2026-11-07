import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import { ApiError } from "@/lib/axios";
import { commentsApi } from "../api/comments.api";
import type { Comment, CommentFilters, CommentList } from "../types/comments";

const POLL_MS = 15_000;
const RATE_LIMITED_POLL_MS = 60_000;

/** Writes a changed comment into every cached list, and keeps the unread counts right. */
export function replaceComment(queryClient: QueryClient, updated: Comment) {
  queryClient.setQueriesData<InfiniteData<CommentList>>({ queryKey: ["comments"] }, (data) => {
    if (!data) return data;
    const previous = data.pages.flatMap((page) => page.items).find((item) => item.id === updated.id);
    const becameRead = previous && !previous.is_read && updated.is_read;
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        unread: becameRead ? Math.max(0, page.unread - 1) : page.unread,
        items: page.items.map((item) => (item.id === updated.id ? updated : item)),
      })),
    };
  });
}

export function useComments(filters: CommentFilters) {
  return useInfiniteQuery({
    queryKey: ["comments", filters],
    queryFn: ({ pageParam }) => commentsApi.list(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((count, page) => count + page.items.length, 0);
      return !lastPage.sample && loaded < lastPage.total ? loaded : undefined;
    },
    // Poll real comments only. Examples never change.
    refetchInterval: (query) => {
      if (query.state.data?.pages[0]?.sample) return false;
      return query.state.error instanceof ApiError && query.state.error.status === 429
        ? RATE_LIMITED_POLL_MS
        : POLL_MS;
    },
    staleTime: 0,
  });
}

export function useReplyToComment(comment: Comment) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => commentsApi.reply(comment, text),
    onSuccess: (updated) => replaceComment(queryClient, updated),
    // A rejected reply is saved as failed, so reload to show the reason.
    onError: () => queryClient.invalidateQueries({ queryKey: ["comments"] }),
  });
}

export function useMarkCommentRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: commentsApi.markRead,
    onSuccess: (updated) => replaceComment(queryClient, updated),
  });
}
