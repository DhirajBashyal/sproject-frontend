import { ArrowLeft, ExternalLink, Sparkles } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PLATFORM_LABEL } from "@/features/channels/components/PlatformIcon";
import { toApiError } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { COMMENT_REPLY_MAX } from "../api/comments.api";
import { useReplyToComment } from "../hooks/useComments";
import { authorName, postUrl, type Comment } from "../types/comments";
import { ReplyStatusLabel } from "./CommentRow";
import { formatTime } from "./ConversationRow";

interface CommentPanelProps {
  comment: Comment;
  onBack: () => void;
  onShowPost: () => void;
}

export function CommentThreadPanel({ comment, onBack, onShowPost }: CommentPanelProps) {
  const reply = useReplyToComment(comment);
  const [draft, setDraft] = useState("");
  const name = authorName(comment);
  const link = postUrl(comment);
  const failed = comment.reply_status === "failed";

  function send() {
    const text = draft.trim();
    if (!text) return;
    reply.mutate(text, { onSuccess: () => setDraft("") });
  }

  return (
    <section className="flex h-full min-w-0 flex-col" aria-label={`Comment from ${name}`}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-3 py-2">
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Back to comments" onClick={onBack}>
          <ArrowLeft />
        </Button>
        <div className="min-w-0 flex-1">
          <b className="block truncate text-sm">{name}</b>
          <span className="block truncate text-xs text-muted-foreground">
            Comment on {PLATFORM_LABEL[comment.platform]}
            {comment.channel_name && ` · ${comment.channel_name}`}
          </span>
        </div>
        <ReplyStatusLabel comment={comment} />
      </header>

      <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <button type="button" className="cursor-pointer font-medium text-primary underline" onClick={onShowPost}>
            All comments on this post
          </button>
          {link && (
            <a href={link} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium text-primary underline">
              View post on Facebook <ExternalLink className="size-3" />
            </a>
          )}
        </div>

        <ol className="grid gap-3" aria-live="polite">
          <li className="flex">
            <div className="max-w-[75%] rounded-xl bg-muted px-4 py-2.5 text-sm font-medium break-words whitespace-pre-wrap">
              {comment.text}
              <time className="mt-1 block text-right text-[11px] font-normal opacity-80">
                {formatTime(comment.created_at)}
              </time>
            </div>
          </li>
          {comment.reply_text && (
            <li className="flex items-start justify-end gap-2">
              <div className="grid max-w-[75%] gap-1">
                <div
                  className={cn(
                    "rounded-xl bg-primary px-4 py-2.5 text-sm font-medium break-words whitespace-pre-wrap text-primary-foreground",
                    failed && "opacity-60",
                  )}
                >
                  {comment.reply_text}
                  {comment.replied_at && (
                    <time className="mt-1 block text-right text-[11px] font-normal opacity-80">
                      {formatTime(comment.replied_at)}
                    </time>
                  )}
                </div>
                {failed && (
                  <p className="text-right text-xs text-destructive">
                    Not posted{comment.reply_error ? `: ${comment.reply_error}` : ""}
                  </p>
                )}
              </div>
              <span
                title={comment.replied_by === "bot" ? "Replied by AI" : "Replied by a person"}
                className="grid size-8 shrink-0 place-items-center rounded-full border text-[10px] text-primary"
              >
                {comment.replied_by === "bot" ? <Sparkles className="size-3.5" /> : "You"}
              </span>
            </li>
          )}
        </ol>

        {comment.reply_status === "pending" && (
          <p className="text-xs text-muted-foreground">
            The AI didn't reply, because it had nothing useful to say or this channel has no chatbot.
          </p>
        )}
        {comment.platform === "facebook" && comment.reply_status === "sent" && (
          <p className="text-xs text-muted-foreground">
            On Facebook, replies are folded under the comment. Open "View 1 reply" there to see it.
          </p>
        )}
      </div>

      <form action={send} className="grid gap-2 border-t p-3">
        <p className="text-xs text-muted-foreground">
          {comment.reply_text
            ? "Your reply is public and replaces this one here. Earlier replies stay visible on the post."
            : "Your reply is public and appears under the comment."}
        </p>
        {reply.error && <Alert>{toApiError(reply.error).detail}</Alert>}
        <Label htmlFor="comment-reply" className="sr-only">
          Public reply
        </Label>
        <Textarea
          id="comment-reply"
          placeholder="Write a public reply…"
          required
          maxLength={COMMENT_REPLY_MAX}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground tabular-nums">
            {draft.length} / {COMMENT_REPLY_MAX}
          </span>
          <Button type="submit" disabled={!draft.trim() || reply.isPending}>
            {reply.isPending ? "Replying…" : "Reply"}
          </Button>
        </div>
      </form>
    </section>
  );
}
