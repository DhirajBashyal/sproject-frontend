import { CheckCircle2, EyeOff, Sparkles, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toApiError } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { COMMENT_REPLY_MAX } from "../api/comments.api";
import { useCommentActions, useMarkCommentRead, useReplyToComment } from "../hooks/useComments";
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

const actionClass = "cursor-pointer font-semibold hover:text-foreground disabled:cursor-default disabled:opacity-50";

interface ConfirmProps {
  message: string;
  confirmLabel: string;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function Confirm({ message, confirmLabel, pending, onConfirm, onCancel }: ConfirmProps) {
  return (
    <div role="alertdialog" aria-label={message} className="grid gap-2 rounded-lg border border-destructive p-3 text-sm">
      <p>{message}</p>
      <div className="flex gap-2">
        <Button variant="destructive" size="sm" disabled={pending} onClick={onConfirm}>
          {pending ? "Deleting…" : confirmLabel}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

interface ReplyFormProps {
  id: string;
  label: string;
  initial: string;
  note: string;
  submitLabel: string;
  pending: boolean;
  error: unknown;
  onSubmit: (text: string, reset: () => void) => void;
  onCancel: () => void;
}

function ReplyForm({ id, label, initial, note, submitLabel, pending, error, onSubmit, onCancel }: ReplyFormProps) {
  const [draft, setDraft] = useState(initial);
  const text = draft.trim();

  return (
    <form
      action={() => {
        if (text) onSubmit(text, () => setDraft(""));
      }}
      className="grid gap-2"
    >
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <Textarea
        id={id}
        autoFocus
        placeholder={label}
        required
        maxLength={COMMENT_REPLY_MAX}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      {Boolean(error) && <Alert>{toApiError(error).detail}</Alert>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{note}</span>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={!text || text === initial || pending}>
            {pending ? "Saving…" : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}

type Mode = "idle" | "replying" | "editing" | "confirm-delete" | "confirm-delete-reply";

interface CommentItemProps {
  comment: Comment;
  active: boolean; // only one comment has a form open at a time
  onActivate: (open: boolean) => void;
}

export function CommentItem({ comment, active, onActivate }: CommentItemProps) {
  const reply = useReplyToComment(comment);
  const markRead = useMarkCommentRead();
  const actions = useCommentActions(comment);
  const [mode, setModeState] = useState<Mode>("idle");
  const current = active ? mode : "idle";
  const name = authorName(comment);
  const pageName = comment.channel_name ?? "Your page";
  const platform = COMMENT_PLATFORM_LABEL[comment.platform];
  const facebook = comment.platform === "facebook";
  const failed = comment.reply_status === "failed";
  // Replies saved before reply IDs existed can't be edited or deleted from here.
  const replyManageable = Boolean(comment.reply_text && comment.reply_external_id);
  const actionError =
    actions.like.error ?? actions.hide.error ?? actions.remove.error ?? actions.deleteReply.error;

  function setMode(next: Mode) {
    setModeState(next);
    onActivate(next !== "idle");
  }

  function startReply() {
    setMode("replying");
    if (!comment.is_read && !markRead.isPending) markRead.mutate(comment);
  }

  return (
    <li className="grid gap-2">
      <div className="flex gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">
          {initials(name)}
        </span>
        <div className="grid min-w-0 gap-1">
          <div
            className={cn(
              "w-fit max-w-full rounded-2xl bg-muted px-4 py-2.5",
              !comment.is_read && "ring-2 ring-primary/40",
              comment.is_hidden && "opacity-60",
            )}
          >
            <span className="flex flex-wrap items-center gap-2">
              <b className="text-sm">{name}</b>
              {comment.is_hidden && (
                <span className="flex items-center gap-1 rounded-full border bg-background px-2 text-[11px] font-medium text-muted-foreground">
                  <EyeOff className="size-3" /> Hidden
                </span>
              )}
            </span>
            <p className="text-sm break-words whitespace-pre-wrap">{comment.text}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 text-xs text-muted-foreground">
            <time>{formatTime(comment.created_at)}</time>
            {facebook && (
              <button
                type="button"
                aria-pressed={comment.is_liked}
                className={cn(actionClass, "flex items-center gap-1", comment.is_liked && "text-primary")}
                disabled={actions.like.isPending}
                onClick={() => actions.like.mutate(!comment.is_liked)}
              >
                <ThumbsUp className={cn("size-3.5", comment.is_liked && "fill-current")} />
                {comment.is_liked ? "Liked" : "Like"}
              </button>
            )}
            <button type="button" className={actionClass} onClick={startReply}>
              Reply
            </button>
            <button
              type="button"
              className={actionClass}
              disabled={actions.hide.isPending}
              onClick={() => actions.hide.mutate(!comment.is_hidden)}
            >
              {comment.is_hidden ? "Unhide" : "Hide"}
            </button>
            <button type="button" className={cn(actionClass, "hover:text-destructive")} onClick={() => setMode("confirm-delete")}>
              Delete
            </button>
            <StatusChip comment={comment} />
            {!comment.is_read && <span className="font-semibold text-primary">New</span>}
          </div>
          {Boolean(actionError) && <Alert className="mt-1">{toApiError(actionError).detail}</Alert>}
        </div>
      </div>

      {current === "confirm-delete" && (
        <div className="ml-13">
          <Confirm
            message={`Delete this comment from ${platform}? ${name} and everyone else will no longer see it. This can't be undone.`}
            confirmLabel="Delete comment"
            pending={actions.remove.isPending}
            onConfirm={() => actions.remove.mutate(undefined, { onSuccess: () => setMode("idle") })}
            onCancel={() => setMode("idle")}
          />
        </div>
      )}

      {(comment.reply_text || current === "replying") && (
        <div className="ml-5 grid gap-3 border-l-2 pl-6">
          {comment.reply_text && current !== "editing" && (
            <div className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full border text-primary">
                {comment.replied_by === "bot" ? <Sparkles className="size-3.5" /> : <span className="text-[10px]">You</span>}
              </span>
              <div className="grid min-w-0 gap-1">
                <div className={cn("w-fit max-w-full rounded-2xl bg-primary-soft px-4 py-2.5", failed && "opacity-70")}>
                  <span className="flex flex-wrap items-center gap-2">
                    <b className="text-sm">{pageName}</b>
                    <span className="rounded-full border bg-background px-2 text-[11px] font-medium text-muted-foreground">
                      {comment.replied_by === "bot" ? "AI reply" : `Replied on ${platform}`}
                    </span>
                  </span>
                  <p className="text-sm break-words whitespace-pre-wrap">{comment.reply_text}</p>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 text-xs text-muted-foreground">
                  {comment.replied_at && <time>{formatTime(comment.replied_at)}</time>}
                  {replyManageable && facebook && (
                    <button type="button" className={actionClass} onClick={() => setMode("editing")}>
                      Edit
                    </button>
                  )}
                  {replyManageable && (
                    <button
                      type="button"
                      className={cn(actionClass, "hover:text-destructive")}
                      onClick={() => setMode("confirm-delete-reply")}
                    >
                      Delete
                    </button>
                  )}
                  {comment.reply_text && !comment.reply_external_id && !failed && (
                    <span>This older reply can't be edited or deleted here.</span>
                  )}
                  {failed && <span className="text-destructive">Not posted{comment.reply_error ? `: ${comment.reply_error}` : ""}</span>}
                </div>
              </div>
            </div>
          )}

          {current === "confirm-delete-reply" && (
            <Confirm
              message={`Delete this reply from ${platform}? The comment goes back to needing an answer.`}
              confirmLabel="Delete reply"
              pending={actions.deleteReply.isPending}
              onConfirm={() => actions.deleteReply.mutate(undefined, { onSuccess: () => setMode("idle") })}
              onCancel={() => setMode("idle")}
            />
          )}

          {current === "editing" && comment.reply_text && (
            <ReplyForm
              id={`edit-${comment.id}`}
              label="Edit your reply"
              initial={comment.reply_text}
              note={`Updates the reply on ${platform}.`}
              submitLabel="Save"
              pending={actions.editReply.isPending}
              error={actions.editReply.error}
              onSubmit={(text) => actions.editReply.mutate(text, { onSuccess: () => setMode("idle") })}
              onCancel={() => setMode("idle")}
            />
          )}

          {current === "replying" && (
            <ReplyForm
              id={`reply-${comment.id}`}
              label={`Reply publicly to ${name}…`}
              initial=""
              note={comment.reply_text ? "Replaces the reply shown here. Earlier replies stay on the post." : "Public reply."}
              submitLabel="Reply"
              pending={reply.isPending}
              error={reply.error}
              onSubmit={(text, reset) =>
                reply.mutate(text, {
                  onSuccess: () => {
                    reset();
                    setMode("idle");
                  },
                })
              }
              onCancel={() => setMode("idle")}
            />
          )}
        </div>
      )}
    </li>
  );
}
