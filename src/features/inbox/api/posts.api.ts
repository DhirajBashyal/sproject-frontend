import { http } from "@/lib/axios";
import type { Post } from "../types/comments";

const postPath = (postId: string) => `/api/inbox/posts/${encodeURIComponent(postId)}`;

export const isSamplePost = (channelId: string) => channelId.startsWith("sample-");

export const postsApi = {
  // Live from Meta. Facebook needs the pages_read_engagement permission.
  get: (postId: string, channelId: string) =>
    http.get<Post>(postPath(postId), { params: { channel_id: channelId } }).then((r) => r.data),

  // Facebook only, needs pages_manage_posts.
  update: (postId: string, channelId: string, text: string) =>
    http.patch<Post>(postPath(postId), { text }, { params: { channel_id: channelId } }).then((r) => r.data),

  // Facebook only. Deletes the post's comments with it.
  remove: (postId: string, channelId: string) =>
    http.delete<void>(postPath(postId), { params: { channel_id: channelId } }),
};
