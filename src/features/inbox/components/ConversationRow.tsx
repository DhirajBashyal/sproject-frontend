import { Sparkles } from "lucide-react";
import { PLATFORM_LABEL, PlatformIcon } from "@/features/channels/components/PlatformIcon";
import { cn } from "@/lib/utils";
import { displayName, type Conversation } from "../types";

function initials(name: string) {
  return name
    .split(/[\s_]+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function formatTime(iso: string) {
  const date = new Date(iso);
  const today = new Date().toDateString() === date.toDateString();
  return today
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
}

interface ConversationRowProps {
  conversation: Conversation;
  selected: boolean;
  onSelect: () => void;
}

export function ConversationRow({ conversation, selected, onSelect }: ConversationRowProps) {
  const name = displayName(conversation);
  const unread = conversation.unread_count > 0;

  return (
    <button
      type="button"
      aria-current={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full cursor-pointer gap-3 rounded-lg p-2.5 text-left hover:bg-muted",
        selected && "bg-muted",
      )}
    >
      <span className="relative grid size-14 shrink-0 place-items-center rounded-full bg-primary-soft font-bold text-primary">
        {initials(name)}
        <span title={PLATFORM_LABEL[conversation.platform]} className="absolute -right-1 -bottom-0.5">
          <PlatformIcon
            platform={conversation.platform}
            className="size-6 rounded-full border-2 border-background"
          />
        </span>
      </span>
      <span className="grid min-w-0 flex-1 content-start gap-1">
        <span className="flex justify-between gap-2">
          <b className={cn("truncate text-sm", unread ? "font-bold" : "font-semibold")}>{name}</b>
          {conversation.last_message_at && (
            <time className="shrink-0 text-xs text-muted-foreground">
              {formatTime(conversation.last_message_at)}
            </time>
          )}
        </span>
        <span className="flex items-center justify-between gap-2">
          {conversation.bot_enabled ? (
            <span className="flex items-center gap-1 text-xs text-primary">
              <Sparkles className="size-3" /> AI Assistance
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Handled by a person</span>
          )}
          {unread && (
            <span
              aria-label={`${conversation.unread_count} unread`}
              className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground"
            >
              {conversation.unread_count}
            </span>
          )}
        </span>
        <span className={cn("truncate text-xs", unread && "font-semibold")}>
          {conversation.last_message_text ?? "No messages yet"}
        </span>
      </span>
    </button>
  );
}
