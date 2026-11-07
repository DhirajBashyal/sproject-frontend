import { ArrowLeft, ExternalLink, ImageIcon, MessageCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/features/channels/components/PlatformIcon";
import { cn } from "@/lib/utils";
import { COMMENT_PLATFORM_LABEL, needsAnswer, postUrl, type PostGroup } from "../types/comments";
import { CommentItem } from "./CommentItem";
import { formatTime } from "./ConversationRow";

interface PostPanelProps {
  post: PostGroup;
  refreshing: boolean;
  onRefresh: () => void;
  onBack: () => void;
}

export function PostPanel({ post, refreshing, onRefresh, onBack }: PostPanelProps) {
  const [filter, setFilter] = useState<"all" | "needs">("all");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const link = postUrl(post);
  const shown = filter === "needs" ? post.comments.filter(needsAnswer) : post.comments;
  const pageName = post.channel_name ?? "Your page";

  return (
    <section className="flex h-full min-w-0 flex-col" aria-label="Post and comments">
      <header className="flex items-center gap-2 border-b px-3 py-2">
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Back to posts" onClick={onBack}>
          <ArrowLeft />
        </Button>
        <div className="min-w-0 flex-1">
          <b className="block truncate">Post on {pageName}</b>
          <span className="block truncate text-xs text-muted-foreground">
            {COMMENT_PLATFORM_LABEL[post.platform]} · latest comment {formatTime(post.latest_at)}
          </span>
        </div>
        {link && (
          <Button variant="ghost" size="icon" asChild>
            <a href={link} target="_blank" rel="noreferrer" aria-label="Open post on Facebook">
              <ExternalLink />
            </a>
          </Button>
        )}
        <Button variant="ghost" size="icon" aria-label="Refresh comments" disabled={refreshing} onClick={onRefresh}>
          <RefreshCw className={cn(refreshing && "animate-spin")} />
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-3xl gap-6 p-4 md:p-6">
          <article className="overflow-hidden rounded-xl border">
            <div className="grid aspect-[16/7] place-items-center bg-muted text-muted-foreground">
              <span className="grid justify-items-center gap-2 text-center text-xs">
                <ImageIcon className="size-8" />
                Post preview isn't available yet
              </span>
            </div>
            <div className="grid gap-3 p-4">
              <div className="flex items-center gap-3">
                <PlatformIcon platform={post.platform} className="size-10 rounded-full" />
                <div className="min-w-0">
                  <b className="block truncate">{pageName}</b>
                  <span className="text-xs text-muted-foreground">{COMMENT_PLATFORM_LABEL[post.platform]} post</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 border-t pt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="size-4" /> {post.comments.length} comments
                </span>
                {link && (
                  <a href={link} target="_blank" rel="noreferrer" className="text-primary underline">
                    View on Facebook
                  </a>
                )}
              </div>
            </div>
          </article>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">Comments</h2>
            <div role="tablist" aria-label="Filter comments" className="flex rounded-lg bg-muted p-1 text-sm">
              {(
                [
                  ["all", `All (${post.comments.length})`],
                  ["needs", `Needs answer (${post.needs_answer})`],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={filter === id}
                  onClick={() => setFilter(id)}
                  className={cn(
                    "cursor-pointer rounded-md px-3 py-1 font-medium",
                    filter === id ? "bg-background text-primary shadow-sm" : "text-muted-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {shown.length === 0 ? (
            <p className="rounded-xl border p-6 text-center text-sm text-muted-foreground">
              Every comment on this post has an answer.
            </p>
          ) : (
            <ol className="grid gap-6 rounded-xl border p-4 md:p-5">
              {shown.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  replying={replyingTo === comment.id}
                  onReplyToggle={(open) => setReplyingTo(open ? comment.id : null)}
                />
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
