import { http } from "@/lib/axios";
import type {
  Conversation,
  ConversationFilters,
  ConversationList,
  ConversationStatus,
  Message,
  MessageList,
} from "../types";

const base = "/api/inbox/conversations";
const conversationPath = (id: string) => `${base}/${encodeURIComponent(id)}`;

export const CONVERSATION_PAGE_SIZE = 20;
export const MESSAGE_PAGE_SIZE = 50;

export const inboxApi = {
  // Sorted by latest activity, newest first.
  conversations: (filters: ConversationFilters, offset: number) =>
    http
      .get<ConversationList>(base, {
        params: { ...filters, limit: CONVERSATION_PAGE_SIZE, offset },
      })
      .then((r) => r.data),

  update: (id: string, changes: { status?: ConversationStatus; bot_enabled?: boolean }) =>
    http.patch<Conversation>(conversationPath(id), changes).then((r) => r.data),

  markRead: (id: string) => http.post<Conversation>(`${conversationPath(id)}/read`).then((r) => r.data),

  // Oldest first. Pass the created_at of the oldest loaded message as `before` to page back.
  messages: (id: string, before?: string) =>
    http
      .get<MessageList>(`${conversationPath(id)}/messages`, {
        params: { limit: MESSAGE_PAGE_SIZE, before },
      })
      .then((r) => r.data),

  send: (id: string, text: string) =>
    http.post<Message>(`${conversationPath(id)}/messages`, { text }).then((r) => r.data),
};
