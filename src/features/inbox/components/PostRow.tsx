import { ImageIcon, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PostGroup } from "../types/comments";
import { formatTime } from "./ConversationRow";

interface PostRowProps {
  post: PostGroup;
  selected: boolean;
  onSelect: () => void;
}

export function PostRow({ post, selected, onSelect }: PostRowProps) {
  // No caption from the API yet, so the newest comment stands in as a preview.
  const preview = post.comments.at(-1)?.text;

  return (
    <button
      type="button"
      aria-current={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full cursor-pointer gap-3 rounded-xl p-2.5 text-left hover:bg-muted",
        selected && "bg-muted",
      )}
    >
      <span className="grid size-16 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <ImageIcon className="size-6" />
      </span>
      <span className="grid min-w-0 flex-1 content-center gap-1">
        <span className="flex items-center justify-between gap-2">
          <b className={cn("truncate text-sm", post.unread > 0 ? "font-bold" : "font-semibold")}>
            Post on {post.channel_name ?? "your page"}
          </b>
          {post.unread > 0 && <span aria-label={`${post.unread} unread`} className="size-2.5 shrink-0 rounded-full bg-primary" />}
        </span>
        {preview && <span className="truncate text-xs text-muted-foreground">Latest: “{preview}”</span>}
        <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <time>{formatTime(post.latest_at)}</time>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1">
            <MessageCircle className="size-3.5" /> {post.comments.length}
          </span>
          {post.needs_answer > 0 && (
            <span className="font-semibold text-warning">{post.needs_answer} need reply</span>
          )}
        </span>
      </span>
    </button>
  );
}
