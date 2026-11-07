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
  replied_by: "bot" | "agent" | null;
  reply_error: string | null; // why Meta rejected the reply
  replied_at: string | null;
  is_read: boolean;
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
}

export function authorName(comment: Comment) {
  return comment.author_name ?? comment.author_id;
}

/** Facebook post IDs open as a URL. Instagram media IDs don't, so they get no link. */
export function postUrl(comment: Comment) {
  return comment.platform === "facebook" ? `https://www.facebook.com/${comment.post_id}` : null;
}
