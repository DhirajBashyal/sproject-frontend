import { ImageIcon, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlatformIcon } from "@/features/channels/components/PlatformIcon";
import { toApiError } from "@/lib/axios";
import { usePost, usePostActions } from "../hooks/usePost";
import { COMMENT_PLATFORM_LABEL, postUrl, type PostGroup } from "../types/comments";
import { formatTime } from "./ConversationRow";

export function PostCard({ post, onDeleted }: { post: PostGroup; onDeleted: () => void }) {
  const details = usePost(post);
  const { update, remove } = usePostActions(post);
  const [mode, setMode] = useState<"view" | "edit" | "confirm-delete">("view");
  const [draft, setDraft] = useState("");
  const data = details.data;
  const pageName = post.channel_name ?? "Your page";
  const platform = COMMENT_PLATFORM_LABEL[post.platform];
  const link = data?.permalink_url ?? postUrl(post);
  const commentCount = `${post.comments.length} ${post.comments.length === 1 ? "comment" : "comments"}`;

  return (
    <article className="overflow-hidden rounded-xl border">
      {data?.image_url ? (
        <img src={data.image_url} alt="" className="max-h-[420px] w-full bg-muted object-contain" />
      ) : (
        <div className="grid aspect-[16/7] place-items-center bg-muted text-muted-foreground">
          <span className="grid justify-items-center gap-2 px-4 text-center text-xs">
            <ImageIcon className="size-8" />
            {details.isFetching ? "Loading post…" : data ? "This post has no picture." : "Post preview isn't available."}
          </span>
        </div>
      )}

      <div className="grid gap-3 p-4">
        <div className="flex items-center gap-3">
          <PlatformIcon platform={post.platform} className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <b className="block truncate">{pageName}</b>
            <span className="text-xs text-muted-foreground">
              {data?.created_time ? formatTime(data.created_time) : `${platform} post`}
            </span>
          </div>
          {mode === "view" && data?.can_edit && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit post"
              onClick={() => {
                setDraft(data.text ?? "");
                setMode("edit");
              }}
            >
              <Pencil />
            </Button>
          )}
          {mode === "view" && data?.can_delete && (
            <Button variant="ghost" size="icon" aria-label="Delete post" onClick={() => setMode("confirm-delete")}>
              <Trash2 />
            </Button>
          )}
        </div>

        {details.error && (
          <Alert variant="warning">Couldn't load the post: {toApiError(details.error).detail}</Alert>
        )}

        {mode === "edit" ? (
          <form
            className="grid gap-2"
            action={() => {
              const text = draft.trim();
              if (text) update.mutate(text, { onSuccess: () => setMode("view") });
            }}
          >
            <Label htmlFor="post-text" className="sr-only">
              Post text
            </Label>
            <Textarea
              id="post-text"
              autoFocus
              required
              rows={4}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            {update.error && <Alert>{toApiError(update.error).detail}</Alert>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setMode("view")}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!draft.trim() || draft.trim() === data?.text || update.isPending}>
                {update.isPending ? "Saving…" : "Save post"}
              </Button>
            </div>
          </form>
        ) : (
          data?.text && <p className="text-sm break-words whitespace-pre-wrap">{data.text}</p>
        )}

        {mode === "confirm-delete" && (
          <div role="alertdialog" aria-label="Delete post" className="grid gap-2 rounded-lg border border-destructive p-3 text-sm">
            <p>
              Delete this post from {platform}? Its {commentCount} are deleted with it. This can't be undone.
            </p>
            {remove.error && <Alert>{toApiError(remove.error).detail}</Alert>}
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                disabled={remove.isPending}
                onClick={() => remove.mutate(undefined, { onSuccess: onDeleted })}
              >
                {remove.isPending ? "Deleting…" : "Delete post"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setMode("view")}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 border-t pt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MessageCircle className="size-4" /> {commentCount}
          </span>
          {link && (
            <a href={link} target="_blank" rel="noreferrer" className="text-primary underline">
              View on {platform}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
