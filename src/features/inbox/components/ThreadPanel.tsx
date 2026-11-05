import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useOptimistic, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { MAX_TEXT } from "@/features/channels/api/channels.api";
import { PLATFORM_LABEL } from "@/features/channels/components/PlatformIcon";
import { toApiError } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { inboxApi } from "../api/inbox.api";
import { addSentMessage, refreshMessages, useMessages, useUpdateConversation } from "../hooks/useInbox";
import { displayName, type Conversation, type Message } from "../types";
import { formatTime } from "./ConversationRow";

type Bubble = Message & { pending?: boolean };

const CLOCK_SKEW_MS = 60_000;

function MessageBubble({ message }: { message: Bubble }) {
  const outbound = message.direction === "out";
  const failed = message.status === "failed";

  return (
    <li className={cn("flex items-start gap-2", outbound && "justify-end")}>
      <div className="grid max-w-[75%] gap-1">
        <div
          className={cn(
            "rounded-xl px-4 py-2.5 text-sm font-medium break-words whitespace-pre-wrap",
            outbound ? "bg-primary text-primary-foreground" : "bg-muted",
            (message.pending || failed) && "opacity-60",
          )}
        >
          {message.text}
          <time className="mt-1 block text-right text-[11px] font-normal opacity-80">
            {message.pending ? "Sending…" : formatTime(message.created_at)}
          </time>
        </div>
        {failed && (
          <p className="text-right text-xs text-destructive">
            Not delivered{message.error ? `: ${message.error}` : ""}
          </p>
        )}
      </div>
      {outbound && (
        <span
          title={message.sender_type === "bot" ? "Sent by AI" : "Sent by a person"}
          className="grid size-8 shrink-0 place-items-center rounded-full border text-[10px] text-primary"
        >
          {message.sender_type === "bot" ? <Sparkles className="size-3.5" /> : "You"}
        </span>
      )}
    </li>
  );
}

export function ThreadPanel({ conversation, onBack }: { conversation: Conversation; onBack: () => void }) {
  const queryClient = useQueryClient();
  const messages = useMessages(conversation.id);
  const update = useUpdateConversation(conversation.id);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [bubbles, addBubble] = useOptimistic(
    (messages.data ?? []) as Bubble[],
    (current, sending: { text: string; at: number }): Bubble[] =>
      // The query cache updates outside the transition, so the saved copy can arrive first.
      // Allow a minute of clock difference between the browser and the server.
      current.some(
        (message) =>
          message.sender_type === "agent" &&
          message.text === sending.text &&
          Date.parse(message.created_at) >= sending.at - CLOCK_SKEW_MS,
      )
        ? current
        : [
            ...current,
            {
              id: `pending-${current.length}`,
              conversation_id: conversation.id,
              direction: "out",
              sender_type: "agent",
              text: sending.text,
              external_message_id: null,
              status: "sent",
              error: null,
              created_at: new Date(sending.at).toISOString(),
              pending: true,
            },
          ],
  );
  const limit = MAX_TEXT[conversation.platform];
  const name = displayName(conversation);
  const closed = conversation.status === "closed";

  async function send() {
    const text = draft.trim();
    if (!text) return;

    setError(null);
    addBubble({ text, at: Date.now() });
    setDraft("");
    try {
      addSentMessage(queryClient, await inboxApi.send(conversation.id, text));
    } catch (caught) {
      setDraft(text); // give the failed message back to the agent
      setError(toApiError(caught).detail);
      // A rejected reply is still saved as failed, so show it in the thread.
      await refreshMessages(queryClient, conversation.id);
    }
  }

  return (
    <section className="flex h-full min-w-0 flex-col" aria-label={`Conversation with ${name}`}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-3 py-2">
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Back to conversations" onClick={onBack}>
          <ArrowLeft />
        </Button>
        <div className="min-w-0 flex-1">
          <b className="block truncate text-sm">{name}</b>
          <span className="block truncate text-xs text-muted-foreground">
            {PLATFORM_LABEL[conversation.platform]}
            {conversation.channel_name && ` · ${conversation.channel_name}`}
          </span>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
          <Switch
            checked={conversation.bot_enabled}
            disabled={update.isPending}
            onCheckedChange={(checked) => update.mutate({ bot_enabled: checked })}
          />
          AI replies
        </label>
        <Button
          variant="outline"
          size="sm"
          disabled={update.isPending}
          onClick={() => update.mutate({ status: closed ? "open" : "closed" })}
        >
          {closed ? "Reopen" : "Close"}
        </Button>
      </header>

      {update.error && <Alert className="m-3 mb-0">{toApiError(update.error).detail}</Alert>}

      <div className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto p-4">
        {messages.hasNextPage && (
          <Button
            variant="ghost"
            size="sm"
            className="justify-self-center"
            disabled={messages.isFetchingNextPage}
            onClick={() => void messages.fetchNextPage()}
          >
            {messages.isFetchingNextPage ? "Loading…" : "Load older messages"}
          </Button>
        )}
        {messages.isPending && <p className="text-sm text-muted-foreground">Loading messages…</p>}
        {messages.error && <Alert>{toApiError(messages.error).detail}</Alert>}
        <ol className="grid gap-3" aria-live="polite">
          {bubbles.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </ol>
      </div>

      <form action={send} className="grid gap-2 border-t p-3">
        {conversation.bot_enabled && (
          <p className="text-xs text-muted-foreground">
            The AI keeps replying too. Turn off AI replies to take over this conversation.
          </p>
        )}
        {error && <Alert>{error}</Alert>}
        <Label htmlFor="reply" className="sr-only">
          Reply
        </Label>
        <Textarea
          id="reply"
          placeholder="Reply…"
          required
          maxLength={limit}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground tabular-nums">
            {draft.length} / {limit}
          </span>
          <Button type="submit" disabled={!draft.trim()}>
            Send
          </Button>
        </div>
      </form>
    </section>
  );
}
