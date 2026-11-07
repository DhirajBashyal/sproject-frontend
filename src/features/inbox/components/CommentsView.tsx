import { RefreshCw } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/features/channels/components/PlatformIcon";
import { toApiError } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { useComments } from "../hooks/useComments";
import { COMMENT_PLATFORM_LABEL, groupByPost, type Comment } from "../types/comments";
import { PostPanel } from "./PostPanel";
import { PostRow } from "./PostRow";

type Platform = Comment["platform"];
type PostFilter = "all" | "unreplied" | "hidden";

const PLATFORMS: Platform[] = ["facebook", "instagram"];

export function CommentsView({ tabs }: { tabs: ReactNode }) {
  const [platform, setPlatform] = useState<Platform>("facebook");
  const [filter, setFilter] = useState<PostFilter>("all");
  // Hidden comments live only under "Hidden".
  const comments = useComments({ platform, hidden: filter === "hidden" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const allPosts = useMemo(
    () => groupByPost(comments.data?.pages.flatMap((page) => page.items) ?? []),
    [comments.data],
  );
  const posts = filter === "unreplied" ? allPosts.filter((post) => post.needs_answer > 0) : allPosts;
  const sample = comments.data?.pages[0]?.sample ?? false;
  const selected = allPosts.find((post) => post.post_id === selectedId);
  if (panelOpen && comments.data && !selected) setPanelOpen(false);
  const showPanel = panelOpen && selected !== undefined;

  return (
    <div className="flex h-full flex-col">
      {sample && (
        <Alert variant="info" className="rounded-none">
          Sample comments. This server doesn't provide comments, so replies here aren't posted.
        </Alert>
      )}
      <div className="flex min-h-0 flex-1">
        <div className={cn("w-full shrink-0 flex-col border-r md:flex md:w-[360px]", showPanel ? "hidden" : "flex")}>
          {tabs}

          <div role="tablist" aria-label="Platform" className="grid grid-cols-2 border-b">
            {PLATFORMS.map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={platform === option}
                onClick={() => {
                  setPlatform(option);
                  setSelectedId(null);
                }}
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-2 border-b-2 py-3 text-sm font-semibold",
                  platform === option
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <PlatformIcon platform={option} className="size-5 rounded-full" />
                {COMMENT_PLATFORM_LABEL[option]}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
            <div role="tablist" aria-label="Posts" className="flex rounded-lg bg-muted p-1 text-sm">
              {(
                [
                  ["all", "All posts"],
                  ["unreplied", "Unreplied"],
                  ["hidden", "Hidden"],
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
            <Button
              variant="ghost"
              size="icon"
              aria-label="Refresh posts"
              disabled={comments.isFetching}
              onClick={() => void comments.refetch()}
            >
              <RefreshCw className={cn(comments.isFetching && "animate-spin")} />
            </Button>
          </div>

          <div className="grid min-h-0 flex-1 content-start gap-1 overflow-y-auto p-2">
            {comments.isPending && <p className="p-3 text-sm text-muted-foreground">Loading posts…</p>}
            {comments.error && <Alert>{toApiError(comments.error).detail}</Alert>}
            {comments.data && posts.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">
                {filter === "unreplied"
                  ? "Every comment has an answer."
                  : filter === "hidden"
                    ? "No hidden comments."
                    : `No comments on your ${COMMENT_PLATFORM_LABEL[platform]} posts yet.`}
              </p>
            )}
            {posts.map((post) => (
              <PostRow
                key={post.post_id}
                post={post}
                selected={post.post_id === selectedId}
                onSelect={() => {
                  setSelectedId(post.post_id);
                  setPanelOpen(true);
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
                {comments.isFetchingNextPage ? "Loading…" : "Load older comments"}
              </Button>
            )}
          </div>
        </div>

        <div className={cn("min-w-0 flex-1 md:block", showPanel ? "block" : "hidden")}>
          {selected ? (
            <PostPanel
              key={selected.post_id}
              post={selected}
              refreshing={comments.isFetching}
              onRefresh={() => void comments.refetch()}
              onBack={() => setPanelOpen(false)}
            />
          ) : (
            <div className="grid h-full place-items-center p-6 text-center text-sm text-muted-foreground">
              Choose a post to see its comments.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
