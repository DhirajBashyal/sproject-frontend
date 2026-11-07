import { CheckCircle2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toApiError } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { COMMENT_REPLY_MAX } from "../api/comments.api";
import { useMarkCommentRead, useReplyToComment } from "../hooks/useComments";
import { authorName, COMMENT_PLATFORM_LABEL, type Comment } from "../types/comments";
import { formatTime } from "./ConversationRow";

function initials(name: string) {
  return name
    .split(/[\s_]+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function StatusChip({ comment }: { comment: Comment }) {
  if (comment.reply_status === "sent") {
    return (
      <span className="flex items-center gap-1 text-success">
        <CheckCircle2 className="size-3.5" /> Answered
      </span>
    );
  }
  if (comment.reply_status === "failed") return <span className="text-destructive">Reply failed</span>;
  return <span className="font-semibold text-warning">Needs answer</span>;
}

interface CommentItemProps {
  comment: Comment;
  replying: boolean;
  onReplyToggle: (open: boolean) => void;
}

export function CommentItem({ comment, replying, onReplyToggle }: CommentItemProps) {
  const reply = useReplyToComment(comment);
  const markRead = useMarkCommentRead();
  const [draft, setDraft] = useState("");
  const name = authorName(comment);
  const pageName = comment.channel_name ?? "Your page";
  const failed = comment.reply_status === "failed";

  function open() {
    onReplyToggle(true);
    if (!comment.is_read && !markRead.isPending) markRead.mutate(comment);
  }

  function send() {
    const text = draft.trim();
    if (!text) return;
    reply.mutate(text, {
      onSuccess: () => {
        setDraft("");
        onReplyToggle(false);
      },
    });
  }

  return (
    <li className="grid gap-2">
      <div className="flex gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">
          {initials(name)}
        </span>
        <div className="grid min-w-0 gap-1">
          <div className={cn("w-fit max-w-full rounded-2xl bg-muted px-4 py-2.5", !comment.is_read && "ring-2 ring-primary/40")}>
            <b className="block text-sm">{name}</b>
            <p className="text-sm break-words whitespace-pre-wrap">{comment.text}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 text-xs text-muted-foreground">
            <time>{formatTime(comment.created_at)}</time>
            <button type="button" className="cursor-pointer font-semibold hover:text-foreground" onClick={open}>
              Reply
            </button>
            <StatusChip comment={comment} />
            {!comment.is_read && <span className="font-semibold text-primary">New</span>}
          </div>
        </div>
      </div>

      {(comment.reply_text || replying) && (
        <div className="ml-5 grid gap-3 border-l-2 pl-6">
          {comment.reply_text && (
            <div className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full border text-primary">
                {comment.replied_by === "bot" ? <Sparkles className="size-3.5" /> : <span className="text-[10px]">You</span>}
              </span>
              <div className="grid min-w-0 gap-1">
                <div className={cn("w-fit max-w-full rounded-2xl bg-primary-soft px-4 py-2.5", failed && "opacity-70")}>
                  <span className="flex flex-wrap items-center gap-2">
                    <b className="text-sm">{pageName}</b>
                    <span className="rounded-full border bg-background px-2 text-[11px] font-medium text-muted-foreground">
                      {comment.replied_by === "bot" ? "AI reply" : `Replied on ${COMMENT_PLATFORM_LABEL[comment.platform]}`}
                    </span>
                  </span>
                  <p className="text-sm break-words whitespace-pre-wrap">{comment.reply_text}</p>
                </div>
                <div className="flex flex-wrap gap-x-4 px-2 text-xs text-muted-foreground">
                  {comment.replied_at && <time>{formatTime(comment.replied_at)}</time>}
                  {failed && <span className="text-destructive">Not posted{comment.reply_error ? `: ${comment.reply_error}` : ""}</span>}
                </div>
              </div>
            </div>
          )}

          {replying && (
            <form action={send} className="grid gap-2">
              <Label htmlFor={`reply-${comment.id}`} className="sr-only">
                Reply to {name}
              </Label>
              <Textarea
                id={`reply-${comment.id}`}
                autoFocus
                placeholder={`Reply publicly to ${name}…`}
                required
                maxLength={COMMENT_REPLY_MAX}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
              {reply.error && <Alert>{toApiError(reply.error).detail}</Alert>}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {comment.reply_text ? "Replaces the reply shown here. Earlier replies stay on the post." : "Public reply."}
                </span>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => onReplyToggle(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={!draft.trim() || reply.isPending}>
                    {reply.isPending ? "Replying…" : "Reply"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}
    </li>
  );
}
