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
    meta: { successToast: "Reply posted successfully", errorTitle: "Unable to post the reply" },
    // A rejected reply is saved as failed, so reload to show the reason.
    onError: () => queryClient.invalidateQueries({ queryKey: ["comments"] }),
  });
}

export function useMarkCommentRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: commentsApi.markRead,
    onSuccess: (updated) => replaceComment(queryClient, updated),
    meta: { errorToast: false }, // happens in the background
  });
}

function removeComment(queryClient: QueryClient, removed: Comment) {
  queryClient.setQueriesData<InfiniteData<CommentList>>({ queryKey: ["comments"] }, (data) =>
    data
      ? {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            total: page.items.some((item) => item.id === removed.id) ? page.total - 1 : page.total,
            unread: page.items.some((item) => item.id === removed.id && !item.is_read) ? page.unread - 1 : page.unread,
            items: page.items.filter((item) => item.id !== removed.id),
          })),
        }
      : data,
  );
}

/** Like, hide, delete, and edit or delete the page's reply. Meta refusing leaves the comment unchanged. */
export function useCommentActions(comment: Comment) {
  const queryClient = useQueryClient();
  const onSuccess = (updated: Comment) => {
    replaceComment(queryClient, updated);
    // Hiding moves the comment between the "All" and "Hidden" lists.
    if (updated.is_hidden !== comment.is_hidden) {
      void queryClient.invalidateQueries({ queryKey: ["comments"], refetchType: "none" });
    }
  };

  return {
    like: useMutation({
      mutationFn: (liked: boolean) => commentsApi.setLiked(comment, liked),
      onSuccess,
      meta: {
        successToast: (_data, liked) => (liked ? "Comment liked successfully" : "Like removed successfully"),
        errorTitle: "Unable to update the like",
      },
    }),
    hide: useMutation({
      mutationFn: (hidden: boolean) => commentsApi.setHidden(comment, hidden),
      onSuccess,
      meta: {
        successToast: (_data, hidden) => (hidden ? "Comment hidden successfully" : "Comment unhidden successfully"),
        errorTitle: "Unable to update the comment",
      },
    }),
    editReply: useMutation({
      mutationFn: (text: string) => commentsApi.editReply(comment, text),
      onSuccess,
      meta: { successToast: "Reply updated successfully", errorTitle: "Unable to update the reply" },
    }),
    deleteReply: useMutation({
      mutationFn: () => commentsApi.deleteReply(comment),
      onSuccess,
      meta: {
        successToast: { title: "Reply deleted successfully", description: "The comment is marked as needing a reply." },
        errorTitle: "Unable to delete the reply",
      },
    }),
    remove: useMutation({
      mutationFn: () => commentsApi.remove(comment),
      meta: { successToast: "Comment deleted successfully", errorTitle: "Unable to delete the comment" },
      onSuccess: () => removeComment(queryClient, comment),
    }),
  };
}
