import type { Channel } from "@/features/channels/types";

// These shapes are the proposed contract. The API has no inbox endpoints yet.
export interface Conversation {
  id: string;
  channel: Pick<Channel, "platform" | "external_id" | "is_active">;
  contact: { recipient_id: string; name: string };
  last_message: { text: string; at: string };
  handled_by: "ai" | "agent";
  tags: string[];
}

export interface Message {
  id: string;
  text: string;
  direction: "inbound" | "outbound";
  sender: "contact" | "ai" | "agent";
  at: string;
}
