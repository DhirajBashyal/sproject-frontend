import { useMutation, useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { isSamplePost, postsApi } from "../api/posts.api";
import type { CommentList, PostGroup } from "../types/comments";

const postKey = (post: Pick<PostGroup, "channel_id" | "post_id">) => ["post", post.channel_id, post.post_id];

/** Loads a post from Meta when it's opened. Rows reuse the cached result, so the list costs no extra requests. */
export function usePost(post: Pick<PostGroup, "channel_id" | "post_id">, enabled = true) {
  return useQuery({
    queryKey: postKey(post),
    queryFn: () => postsApi.get(post.post_id, post.channel_id),
    enabled: enabled && !isSamplePost(post.channel_id),
    staleTime: 10 * 60_000,
  });
}

export function usePostActions(post: PostGroup) {
  const queryClient = useQueryClient();
  return {
    update: useMutation({
      mutationFn: (text: string) => postsApi.update(post.post_id, post.channel_id, text),
      onSuccess: (updated) => queryClient.setQueryData(postKey(post), updated),
    }),
    remove: useMutation({
      mutationFn: () => postsApi.remove(post.post_id, post.channel_id),
      onSuccess: () => {
        queryClient.removeQueries({ queryKey: postKey(post) });
        // Deleting the post deletes its comments too.
        queryClient.setQueriesData<InfiniteData<CommentList>>({ queryKey: ["comments"] }, (data) =>
          data
            ? {
                ...data,
                pages: data.pages.map((page) => {
                  const gone = page.items.filter((item) => item.post_id === post.post_id);
                  return {
                    ...page,
                    total: page.total - gone.length,
                    unread: page.unread - gone.filter((item) => !item.is_read).length,
                    items: page.items.filter((item) => item.post_id !== post.post_id),
                  };
                }),
              }
            : data,
        );
      },
    }),
  };
}
