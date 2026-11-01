import { Sparkles } from "lucide-react";
import { PLATFORM_LABEL, PlatformIcon } from "@/features/channels/components/PlatformIcon";
import { cn } from "@/lib/utils";
import type { Conversation } from "../types";

const VISIBLE_TAGS = 2;

const tagStyles: Record<string, string> = {
  urgent: "border-destructive bg-destructive-soft text-destructive",
  sponsored: "border-success bg-success-soft text-success",
};

function initials(name: string) {
  return name
    .split(/[\s_]+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface ConversationRowProps {
  conversation: Conversation;
  selected: boolean;
  onSelect: () => void;
}

export function ConversationRow({ conversation, selected, onSelect }: ConversationRowProps) {
  const { contact, channel, last_message, handled_by, tags } = conversation;
  const extraTags = tags.length - VISIBLE_TAGS;

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
        {initials(contact.name)}
        <span title={PLATFORM_LABEL[channel.platform]} className="absolute -right-1 -bottom-0.5">
          <PlatformIcon platform={channel.platform} className="size-6 rounded-full border-2 border-background" />
        </span>
      </span>
      <span className="grid min-w-0 flex-1 content-start gap-1">
        <span className="flex justify-between gap-2">
          <b className="truncate text-sm font-semibold">{contact.name}</b>
          <time className="shrink-0 text-xs text-muted-foreground">{formatTime(last_message.at)}</time>
        </span>
        {handled_by === "ai" && (
          <span className="flex items-center gap-1 text-xs text-primary">
            <Sparkles className="size-3" /> AI Assistance
          </span>
        )}
        {tags.length > 0 && (
          <span className="flex flex-wrap gap-1">
            {tags.slice(0, VISIBLE_TAGS).map((tag) => (
              <span
                key={tag}
                className={cn(
                  "rounded-full border px-2 text-[11px] leading-5 font-semibold",
                  tagStyles[tag] ?? "border-transparent bg-muted text-muted-foreground",
                )}
              >
                {tag}
              </span>
            ))}
            {extraTags > 0 && (
              <span className="rounded-full bg-primary-soft px-2 text-[11px] leading-5 font-semibold text-primary">
                +{extraTags} more
              </span>
            )}
          </span>
        )}
        <span className="truncate text-xs">{last_message.text}</span>
      </span>
    </button>
  );
}
