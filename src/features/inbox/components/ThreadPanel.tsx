import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useOptimistic, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MAX_TEXT } from "@/features/channels/api/channels.api";
import { toApiError } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { inboxApi } from "../api/inbox.api";
import { useMessages } from "../hooks/useInbox";
import type { Conversation, Message } from "../types";
import { formatTime } from "./ConversationRow";

type Bubble = Message & { pending?: boolean };

function MessageBubble({ message }: { message: Bubble }) {
  const outbound = message.direction === "outbound";
  return (
    <li className={cn("flex items-start gap-2", outbound && "justify-end")}>
      <div
        className={cn(
          "max-w-[75%] rounded-xl px-4 py-2.5 text-sm font-medium break-words",
          outbound ? "bg-primary text-primary-foreground" : "bg-muted",
          message.pending && "opacity-60",
        )}
      >
        {message.text}
        <time className="mt-1 block text-right text-[11px] font-normal opacity-80">
          {message.pending ? "Sending…" : formatTime(message.at)}
        </time>
      </div>
      {outbound && (
        <span
          title={message.sender === "ai" ? "Sent by AI" : "Sent by an agent"}
          className="grid size-8 shrink-0 place-items-center rounded-full border text-[10px] text-primary"
        >
          {message.sender === "ai" ? <Sparkles className="size-3.5" /> : "You"}
        </span>
      )}
    </li>
  );
}

export function ThreadPanel({ conversation, onBack }: { conversation: Conversation; onBack: () => void }) {
  const queryClient = useQueryClient();
  const messages = useMessages(conversation.id);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [bubbles, addBubble] = useOptimistic(
    (messages.data ?? []) as Bubble[],
    (current, text: string): Bubble[] => [
      ...current,
      {
        id: `pending-${current.length}`,
        text,
        direction: "outbound",
        sender: "agent",
        at: new Date().toISOString(),
        pending: true,
      },
    ],
  );
  const { platform, is_active: active } = conversation.channel;
  const limit = MAX_TEXT[platform];

  async function send() {
    const text = draft.trim();
    if (!text) return;

    setError(null);
    addBubble(text);
    setDraft("");
    try {
      await inboxApi.send(conversation, text);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["messages", conversation.id] }),
        queryClient.invalidateQueries({ queryKey: ["conversations"] }),
      ]);
    } catch (caught) {
      setDraft(text); // give the failed message back to the agent
      setError(toApiError(caught).detail);
    }
  }

  return (
    <section className="flex h-full min-w-0 flex-col" aria-label={`Conversation with ${conversation.contact.name}`}>
      <div className="flex items-center gap-2 border-b p-2 md:hidden">
        <Button variant="ghost" size="icon" aria-label="Back to conversations" onClick={onBack}>
          <ArrowLeft />
        </Button>
        <b className="truncate text-sm">{conversation.contact.name}</b>
      </div>

      <ol className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto p-4" aria-live="polite">
        {bubbles.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </ol>

      <form action={send} className="grid gap-2 border-t p-3">
        {!active && <Alert variant="warning">This channel is disconnected. Reconnect it to reply.</Alert>}
        {error && <Alert>{error}</Alert>}
        <Label htmlFor="reply" className="sr-only">
          Reply
        </Label>
        <Textarea
          id="reply"
          placeholder="Reply…"
          required
          disabled={!active}
          maxLength={limit}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground tabular-nums">
            {draft.length} / {limit}
          </span>
          <Button type="submit" disabled={!active || !draft.trim()}>
            Send
          </Button>
        </div>
      </form>
    </section>
  );
}
