import { Filter, MessageSquareText, RefreshCw, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PLATFORM_LABEL } from "@/features/channels/components/PlatformIcon";
import { toApiError } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { useComments, useMarkCommentRead } from "../hooks/useComments";
import type { Comment, CommentFilters } from "../types/comments";
import { CommentRow } from "./CommentRow";
import { CommentThreadPanel } from "./CommentThreadPanel";

type View = "all" | "unread" | "pending" | "failed";

const VIEWS: Record<View, string> = { all: "All", unread: "Unread", pending: "Needs reply", failed: "Reply failed" };

const selectClass =
  "rounded-md bg-transparent py-1 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary";

type Platform = Comment["platform"];

function toFilters(view: View, platform: Platform | "all", postId: string | null): CommentFilters {
  return {
    ...(platform !== "all" && { platform }),
    ...(postId && { post_id: postId }),
    ...(view === "unread" && { unread_only: true }),
    ...((view === "pending" || view === "failed") && { reply_status: view }),
  };
}

export function CommentsView({ tabs }: { tabs: ReactNode }) {
  const [view, setView] = useState<View>("all");
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [postId, setPostId] = useState<string | null>(null);
  const comments = useComments(toFilters(view, platform, postId));
  const markRead = useMarkCommentRead();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [threadOpen, setThreadOpen] = useState(false);

  const items = comments.data?.pages.flatMap((page) => page.items) ?? [];
  const firstPage = comments.data?.pages[0];
  const selected = items.find(({ id }) => id === selectedId);
  // On phones, go back to the list if a filter hides the open comment.
  if (threadOpen && comments.data && !selected) setThreadOpen(false);
  const showThread = threadOpen && selected !== undefined;

  // Mark the open comment read once.
  const marked = useRef<string | null>(null);
  useEffect(() => {
    if (!selected || selected.is_read || marked.current === selected.id) return;
    marked.current = selected.id;
    markRead.mutate(selected);
  }, [selected, markRead]);

  return (
    <div className="flex h-full flex-col">
      {firstPage?.sample && (
        <Alert variant="info" className="rounded-none">
          Sample comments. This server doesn't provide comments, so replies here aren't posted.
        </Alert>
      )}
      <div className="flex min-h-0 flex-1">
        <div className={cn("w-full shrink-0 flex-col border-r md:flex md:w-[340px]", showThread ? "hidden" : "flex")}>
          {tabs}
          <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
            <select
              aria-label="Show comments"
              className={selectClass}
              value={view}
              onChange={(event) => setView(event.target.value as View)}
            >
              {Object.entries(VIEWS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <Filter className="size-4 text-muted-foreground" aria-hidden="true" />
              <select
                aria-label="Filter comments by platform"
                className={cn(selectClass, "max-w-28")}
                value={platform}
                onChange={(event) => setPlatform(event.target.value as Platform | "all")}
              >
                <option value="all">All</option>
                <option value="facebook">{PLATFORM_LABEL.facebook}</option>
                <option value="instagram">{PLATFORM_LABEL.instagram}</option>
              </select>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Refresh comments"
                disabled={comments.isFetching}
                onClick={() => void comments.refetch()}
              >
                <RefreshCw className={cn(comments.isFetching && "animate-spin")} />
              </Button>
            </div>
          </div>

          {postId && (
            <div className="flex items-center justify-between gap-2 border-b bg-primary-soft px-4 py-2 text-xs text-primary">
              <span className="truncate">Comments on one post</span>
              <button
                type="button"
                className="flex shrink-0 cursor-pointer items-center gap-1 font-semibold"
                onClick={() => setPostId(null)}
              >
                <X className="size-3.5" /> Show all
              </button>
            </div>
          )}

          <p className="flex items-center gap-2 px-4 pt-3 pb-1 text-xs text-muted-foreground">
            <MessageSquareText className="size-3.5" /> {view === "all" ? "All comments" : VIEWS[view]}
            {firstPage && ` · ${firstPage.total}`}
            {firstPage && firstPage.unread > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                {firstPage.unread} unread
              </span>
            )}
          </p>

          <div className="grid min-h-0 flex-1 content-start gap-0.5 overflow-y-auto px-2 pb-2">
            {comments.isPending && <p className="p-3 text-sm text-muted-foreground">Loading comments…</p>}
            {comments.error && <Alert>{toApiError(comments.error).detail}</Alert>}
            {comments.data && items.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">
                {view !== "all" || platform !== "all" || postId
                  ? "No comments match these filters."
                  : "No comments yet. Comments on your Facebook and Instagram posts appear here."}
              </p>
            )}
            {items.map((comment) => (
              <CommentRow
                key={comment.id}
                comment={comment}
                selected={comment.id === selectedId}
                onSelect={() => {
                  setSelectedId(comment.id);
                  setThreadOpen(true);
                }}
              />
            ))}
            {comments.hasNextPage && (
              <Button
                variant="ghost"
                size="sm"
                disabled={comments.isFetchingNextPage}
                onClick={() => void comments.fetchNextPage()}
              >
                {comments.isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            )}
          </div>
        </div>

        <div className={cn("min-w-0 flex-1 md:block", showThread ? "block" : "hidden")}>
          {selected ? (
            <CommentThreadPanel
              key={selected.id}
              comment={selected}
              onBack={() => setThreadOpen(false)}
              onShowPost={() => setPostId(selected.post_id)}
            />
          ) : (
            <div className="grid h-full place-items-center p-6 text-center text-sm text-muted-foreground">
              Choose a comment to read and reply.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
