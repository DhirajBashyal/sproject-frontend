import type { Platform } from "@/features/channels/types";

export type ReplyStatus = "pending" | "sent" | "failed";

/** One comment and its single reply: the bot's, or the latest one sent from the dashboard. */
export interface Comment {
  id: string;
  channel_id: string;
  platform: Exclude<Platform, "whatsapp">; // WhatsApp has no comments
  channel_name: string | null;
  external_comment_id: string;
  post_id: string; // Facebook post ID or Instagram media ID
  author_id: string;
  author_name: string | null; // Facebook name or Instagram username
  text: string;
  reply_status: ReplyStatus; // pending = not answered yet
  reply_text: string | null;
  reply_external_id: string | null; // null for replies saved before reply IDs existed: can't edit or delete them
  replied_by: "bot" | "agent" | null;
  reply_error: string | null; // why Meta rejected the reply
  replied_at: string | null;
  is_read: boolean;
  is_liked: boolean; // liked by the page (Facebook only)
  is_hidden: boolean;
  created_at: string;
}

export interface CommentList {
  items: Comment[];
  total: number;
  unread: number; // unread comments matching the same filters
  sample: boolean; // true = this server has no comments API, so these are examples
}

export interface CommentFilters {
  platform?: Comment["platform"];
  post_id?: string;
  reply_status?: ReplyStatus;
  unread_only?: boolean;
  hidden?: boolean; // leave out for all comments
}

export function authorName(comment: Comment) {
  return comment.author_name ?? comment.author_id;
}

/** Facebook post IDs open as a URL. Instagram media IDs don't, so they get no link. */
export function postUrl(post: { platform: Comment["platform"]; post_id: string }) {
  return post.platform === "facebook" ? `https://www.facebook.com/${post.post_id}` : null;
}

export const COMMENT_PLATFORM_LABEL: Record<Comment["platform"], string> = {
  facebook: "Facebook",
  instagram: "Instagram",
};

/** The API has no posts endpoint, so posts are built from their comments. */
export interface PostGroup {
  post_id: string;
  channel_id: string;
  platform: Comment["platform"];
  channel_name: string | null;
  comments: Comment[]; // oldest first
  latest_at: string;
  unread: number;
  needs_answer: number;
}

export function needsAnswer(comment: Comment) {
  return comment.reply_status !== "sent";
}

export function groupByPost(comments: Comment[]): PostGroup[] {
  const posts = new Map<string, PostGroup>();
  for (const comment of comments) {
    const post = posts.get(comment.post_id) ?? {
      post_id: comment.post_id,
      channel_id: comment.channel_id,
      platform: comment.platform,
      channel_name: comment.channel_name,
      comments: [],
      latest_at: comment.created_at,
      unread: 0,
      needs_answer: 0,
    };
    post.comments.push(comment);
    if (comment.created_at > post.latest_at) post.latest_at = comment.created_at;
    if (!comment.is_read) post.unread += 1;
    if (needsAnswer(comment)) post.needs_answer += 1;
    posts.set(comment.post_id, post);
  }
  for (const post of posts.values()) post.comments.sort((a, b) => a.created_at.localeCompare(b.created_at));
  return [...posts.values()].sort((a, b) => b.latest_at.localeCompare(a.latest_at));
}

/** Live post details from Meta. */
export interface Post {
  id: string;
  channel_id: string;
  platform: Comment["platform"];
  text: string | null;
  image_url: string | null;
  permalink_url: string | null;
  created_time: string | null;
  can_edit: boolean; // Facebook only
  can_delete: boolean; // Facebook only
}
