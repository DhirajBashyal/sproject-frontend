import { ApiError } from "@/lib/axios";
import type { Conversation, Message } from "../types";

// Sample data only, used while VITE_INBOX_USE_MOCK=true.
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

const conversations: Conversation[] = [
  {
    id: "c1",
    channel: { platform: "facebook", external_id: "sample-page", is_active: true },
    contact: { recipient_id: "sample-1", name: "Sample Customer" },
    last_message: { text: "Thanks for your message", at: minutesAgo(2) },
    handled_by: "ai",
    tags: [],
  },
  {
    id: "c2",
    channel: { platform: "instagram", external_id: "sample-account", is_active: true },
    contact: { recipient_id: "sample-2", name: "sample_user" },
    last_message: { text: "What are your opening hours?", at: minutesAgo(45) },
    handled_by: "agent",
    tags: [],
  },
  {
    id: "c3",
    channel: { platform: "whatsapp", external_id: "sample-number", is_active: true },
    contact: { recipient_id: "15550002222", name: "Sample Lead" },
    last_message: { text: "Is the course still open?", at: minutesAgo(190) },
    handled_by: "ai",
    tags: ["urgent", "sponsored", "admissions", "new", "follow-up"],
  },
  {
    id: "c4",
    channel: { platform: "facebook", external_id: "sample-page", is_active: true },
    contact: { recipient_id: "sample-4", name: "Outside Reply Window" },
    last_message: { text: "Sending here shows a failed send", at: minutesAgo(2000) },
    handled_by: "agent",
    tags: [],
  },
  {
    id: "c5",
    channel: { platform: "instagram", external_id: "sample-old", is_active: false },
    contact: { recipient_id: "sample-5", name: "Disconnected Channel" },
    last_message: { text: "This channel can't send replies", at: minutesAgo(3000) },
    handled_by: "agent",
    tags: [],
  },
];

const threads: Record<string, Message[]> = Object.fromEntries(
  conversations.map(({ id, last_message, handled_by }) => [
    id,
    [
      { id: `${id}-1`, text: "Hello, can you help me?", direction: "inbound", sender: "contact", at: minutesAgo(3100) },
      {
        id: `${id}-2`,
        text: last_message.text,
        direction: id === "c2" ? "inbound" : "outbound",
        sender: id === "c2" ? "contact" : handled_by,
        at: last_message.at,
      },
    ] satisfies Message[],
  ]),
);

const wait = () => new Promise((resolve) => setTimeout(resolve, 300));

export const inboxMock = {
  async conversations() {
    await wait();
    return conversations.map((conversation) => ({ ...conversation }));
  },
  async messages(conversationId: string) {
    await wait();
    return [...(threads[conversationId] ?? [])];
  },
  async send(conversation: Conversation, text: string) {
    await wait();
    if (conversation.id === "c4") {
      throw new ApiError(400, "Meta rejected this message: it's outside the 24-hour reply window.");
    }
    const at = new Date().toISOString();
    threads[conversation.id]?.push({
      id: crypto.randomUUID(),
      text,
      direction: "outbound",
      sender: "agent",
      at,
    });
    const stored = conversations.find(({ id }) => id === conversation.id);
    if (stored) stored.last_message = { text, at };
  },
};
