import { ApiError, http } from "@/lib/axios";
import type { Comment, CommentFilters, CommentList } from "../types/comments";
import { sampleComments } from "./comments.sample";

const base = "/api/inbox/comments";
const commentPath = (id: string) => `${base}/${encodeURIComponent(id)}`;

// Comments are grouped into posts on the client, so fetch large pages.
export const COMMENT_PAGE_SIZE = 100;
export const COMMENT_REPLY_MAX = 2000;

const isSample = (comment: Comment) => comment.id.startsWith("sample-");

function samplePage(filters: CommentFilters): CommentList {
  const items = sampleComments.filter(
    (comment) =>
      (!filters.platform || comment.platform === filters.platform) &&
      (!filters.post_id || comment.post_id === filters.post_id) &&
      (!filters.reply_status || comment.reply_status === filters.reply_status) &&
      (!filters.unread_only || !comment.is_read) &&
      (filters.hidden === undefined || comment.is_hidden === filters.hidden),
  );
  return { items, total: items.length, unread: items.filter((c) => !c.is_read).length, sample: true };
}

export const commentsApi = {
  // Newest first.
  async list(filters: CommentFilters, offset: number): Promise<CommentList> {
    try {
      const { data } = await http.get<Omit<CommentList, "sample">>(base, {
        params: { ...filters, limit: COMMENT_PAGE_SIZE, offset },
      });
      return { ...data, sample: false };
    } catch (error) {
      // An older server without the comments API: show examples instead of an error.
      if (error instanceof ApiError && (error.status === 404 || error.status === 405)) return samplePage(filters);
      throw error;
    }
  },

  async markRead(comment: Comment): Promise<Comment> {
    if (isSample(comment)) return { ...comment, is_read: true };
    const { data } = await http.post<Comment>(`${commentPath(comment.id)}/read`);
    return data;
  },

  // Posts a public reply under the comment, and marks it read.
  async reply(comment: Comment, text: string): Promise<Comment> {
    if (isSample(comment)) {
      return {
        ...comment,
        reply_status: "sent",
        reply_text: text,
        replied_by: "agent",
        reply_external_id: `sample-reply-${crypto.randomUUID()}`,
        reply_error: null,
        replied_at: new Date().toISOString(),
        is_read: true,
      };
    }
    const { data } = await http.post<Comment>(`${commentPath(comment.id)}/reply`, { text });
    return data;
  },

  // Facebook only. Instagram answers 400 "Not supported on Instagram".
  async setLiked(comment: Comment, liked: boolean): Promise<Comment> {
    if (isSample(comment)) return { ...comment, is_liked: liked };
    const path = `${commentPath(comment.id)}/like`;
    const { data } = liked ? await http.post<Comment>(path) : await http.delete<Comment>(path);
    return data;
  },

  async setHidden(comment: Comment, hidden: boolean): Promise<Comment> {
    if (isSample(comment)) return { ...comment, is_hidden: hidden };
    const path = `${commentPath(comment.id)}/hide`;
    const { data } = hidden ? await http.post<Comment>(path) : await http.delete<Comment>(path);
    return data;
  },

  // Deletes the customer's comment on Facebook or Instagram too.
  async remove(comment: Comment): Promise<void> {
    if (isSample(comment)) return;
    await http.delete(commentPath(comment.id));
  },

  // Facebook only.
  async editReply(comment: Comment, text: string): Promise<Comment> {
    if (isSample(comment)) return { ...comment, reply_text: text, replied_by: "agent" };
    const { data } = await http.patch<Comment>(`${commentPath(comment.id)}/reply`, { text });
    return data;
  },

  // Sets the comment back to pending.
  async deleteReply(comment: Comment): Promise<Comment> {
    if (isSample(comment)) {
      return { ...comment, reply_status: "pending", reply_text: null, replied_by: null, reply_external_id: null, replied_at: null };
    }
    const { data } = await http.delete<Comment>(`${commentPath(comment.id)}/reply`);
    return data;
  },
};
