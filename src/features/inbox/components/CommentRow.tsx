import { MessageSquareText, Sparkles } from "lucide-react";
import { PLATFORM_LABEL, PlatformIcon } from "@/features/channels/components/PlatformIcon";
import { cn } from "@/lib/utils";
import { authorName, type Comment } from "../types/comments";
import { formatTime } from "./ConversationRow";

export function ReplyStatusLabel({ comment }: { comment: Comment }) {
  if (comment.reply_status === "pending") {
    return <span className="text-xs font-semibold text-warning">Needs reply</span>;
  }
  if (comment.reply_status === "failed") {
    return <span className="text-xs font-semibold text-destructive">Reply failed</span>;
  }
  return comment.replied_by === "bot" ? (
    <span className="flex items-center gap-1 text-xs text-primary">
      <Sparkles className="size-3" /> AI replied
    </span>
  ) : (
    <span className="text-xs text-muted-foreground">You replied</span>
  );
}

interface CommentRowProps {
  comment: Comment;
  selected: boolean;
  onSelect: () => void;
}

export function CommentRow({ comment, selected, onSelect }: CommentRowProps) {
  const unread = !comment.is_read;

  return (
    <button
      type="button"
      aria-current={selected}
      onClick={onSelect}
      className={cn("flex w-full cursor-pointer gap-3 rounded-lg p-2.5 text-left hover:bg-muted", selected && "bg-muted")}
    >
      <span className="relative grid size-14 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
        <MessageSquareText className="size-6" />
        <span title={PLATFORM_LABEL[comment.platform]} className="absolute -right-1 -bottom-0.5">
          <PlatformIcon platform={comment.platform} className="size-6 rounded-full border-2 border-background" />
        </span>
      </span>
      <span className="grid min-w-0 flex-1 content-start gap-1">
        <span className="flex justify-between gap-2">
          <b className={cn("truncate text-sm", unread ? "font-bold" : "font-semibold")}>{authorName(comment)}</b>
          <time className="shrink-0 text-xs text-muted-foreground">{formatTime(comment.created_at)}</time>
        </span>
        <span className="flex items-center justify-between gap-2">
          <ReplyStatusLabel comment={comment} />
          {unread && <span aria-label="Unread" className="size-2.5 shrink-0 rounded-full bg-primary" />}
        </span>
        <span className={cn("truncate text-xs", unread && "font-semibold")}>“{comment.text}”</span>
        {comment.channel_name && (
          <span className="truncate text-[11px] text-muted-foreground">On {comment.channel_name}</span>
        )}
      </span>
    </button>
  );
}
