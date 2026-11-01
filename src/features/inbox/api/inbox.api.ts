import { env } from "@/config/env";
import { channelsApi } from "@/features/channels/api/channels.api";
import type { Channel } from "@/features/channels/types";
import { inboxMock } from "./inbox.mock";
import type { Conversation, Message } from "../types";

// The API has no routes for reading conversations. Connect them here when it does.
export const inboxAvailable = env.inboxUseMock;

export const inboxApi = {
  conversations: (): Promise<Conversation[]> => (env.inboxUseMock ? inboxMock.conversations() : Promise.resolve([])),
  messages: (conversationId: string): Promise<Message[]> =>
    env.inboxUseMock ? inboxMock.messages(conversationId) : Promise.resolve([]),
  send: async (conversation: Conversation, text: string): Promise<void> => {
    if (env.inboxUseMock) return inboxMock.send(conversation, text);
    await channelsApi.sendText(conversation.channel as Channel, conversation.contact.recipient_id, text);
  },
};
