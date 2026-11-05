import type { Platform } from "@/features/channels/types";

export type ConversationStatus = "open" | "closed";

export interface Conversation {
  id: string;
  channel_id: string;
  platform: Platform;
  channel_name: string | null;
  external_user_id: string; // PSID, Instagram user ID or WhatsApp number
  user_name: string | null; // null when Meta doesn't provide a name
  last_message_text: string | null;
  last_message_at: string | null;
  unread_count: number;
  status: ConversationStatus;
  bot_enabled: boolean; // false = a person has taken over
  created_at: string;
  updated_at: string;
}

export interface ConversationList {
  items: Conversation[];
  total: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  direction: "in" | "out";
  sender_type: "customer" | "bot" | "agent";
  text: string;
  external_message_id: string | null;
  status: "received" | "sent" | "failed";
  error: string | null; // why Meta rejected an outgoing message
  created_at: string;
}

export interface MessageList {
  items: Message[]; // oldest first
  has_more: boolean;
}

export interface ConversationFilters {
  platform?: Platform;
  status?: ConversationStatus;
  unread_only?: boolean;
  search?: string;
}

export function displayName(conversation: Conversation) {
  return conversation.user_name ?? conversation.external_user_id;
}
