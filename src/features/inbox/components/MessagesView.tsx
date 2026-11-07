import { useQueryClient } from "@tanstack/react-query";
import { Filter, MessagesSquare, RefreshCw, Search } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PLATFORM_LABEL } from "@/features/channels/components/PlatformIcon";
import { PLATFORMS, type Platform } from "@/features/channels/types";
import { useDebounce } from "@/hooks/useDebounce";
import { toApiError } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { ConversationRow } from "./ConversationRow";
import { ThreadPanel } from "./ThreadPanel";
import { refreshMessages, useConversations, useMarkRead } from "../hooks/useInbox";
import type { ConversationFilters } from "../types";

type View = "all" | "unread" | "open" | "closed";

const VIEWS: Record<View, string> = { all: "All", unread: "Unread", open: "Open", closed: "Closed" };

const selectClass =
  "rounded-md bg-transparent py-1 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary";

function toFilters(view: View, platform: Platform | "all", search: string): ConversationFilters {
  return {
    ...(platform !== "all" && { platform }),
    ...(view === "unread" && { unread_only: true }),
    ...((view === "open" || view === "closed") && { status: view }),
    ...(search && { search }),
  };
}

export function MessagesView({ tabs }: { tabs: ReactNode }) {
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("all");
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [searchText, setSearchText] = useState("");
  const search = useDebounce(searchText.trim(), 400);
  const conversations = useConversations(toFilters(view, platform, search));
  const markRead = useMarkRead();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [threadOpen, setThreadOpen] = useState(false);

  const items = conversations.data?.pages.flatMap((page) => page.items) ?? [];
  const selected = items.find(({ id }) => id === selectedId);
  // On phones, go back to the list if a filter hides the open conversation.
  if (threadOpen && conversations.data && !selected) setThreadOpen(false);
  const showThread = threadOpen && selected !== undefined;

  // Mark the open conversation read, once per new message.
  const markedAt = useRef<string | null>(null);
  useEffect(() => {
    if (!selected || selected.unread_count === 0) return;
    const marker = `${selected.id}:${selected.last_message_at}`;
    if (markedAt.current === marker) return;
    markedAt.current = marker;
    markRead.mutate(selected.id);
  }, [selected, markRead]);

  // Polling only refreshes the list. Reload the open thread when its last message changes.
  const lastSeen = useRef<string | null>(null);
  useEffect(() => {
    if (!selected) return;
    const marker = `${selected.id}:${selected.last_message_at}`;
    if (lastSeen.current?.startsWith(`${selected.id}:`) && lastSeen.current !== marker) {
      void refreshMessages(queryClient, selected.id);
    }
    lastSeen.current = marker;
  }, [selected, queryClient]);

  return (
    <div className="flex h-full">
      <div
        className={cn("w-full shrink-0 flex-col border-r md:flex md:w-[340px]", showThread ? "hidden" : "flex")}
      >
        {tabs}
        <div className="grid gap-2 border-b px-4 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <select
              aria-label="Show conversations"
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
                aria-label="Filter by platform"
                className={cn(selectClass, "max-w-28")}
                value={platform}
                onChange={(event) => setPlatform(event.target.value as Platform | "all")}
              >
                <option value="all">All</option>
                {PLATFORMS.map((option) => (
                  <option key={option} value={option}>
                    {PLATFORM_LABEL[option]}
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Refresh conversations"
                disabled={conversations.isFetching}
                onClick={() => void conversations.refetch()}
              >
                <RefreshCw className={cn(conversations.isFetching && "animate-spin")} />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              id="inbox-search"
              type="search"
              aria-label="Search by name"
              placeholder="Search by name"
              maxLength={100}
              className="pl-8"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>
        </div>

        <p className="flex items-center gap-2 px-4 pt-3 pb-1 text-xs text-muted-foreground">
          <MessagesSquare className="size-3.5" /> {VIEWS[view] === "All" ? "All Conversation" : VIEWS[view]}
          {conversations.data && ` · ${conversations.data.pages[0]?.total ?? 0}`}
        </p>

        <div className="grid min-h-0 flex-1 content-start gap-0.5 overflow-y-auto px-2 pb-2">
          {conversations.isPending && <p className="p-3 text-sm text-muted-foreground">Loading conversations…</p>}
          {conversations.error && <Alert>{toApiError(conversations.error).detail}</Alert>}
          {conversations.data && items.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">
              {search || view !== "all" || platform !== "all"
                ? "No conversations match these filters."
                : "No conversations yet. Messages to your connected channels appear here."}
            </p>
          )}
          {items.map((conversation) => (
            <ConversationRow
              key={conversation.id}
              conversation={conversation}
              selected={conversation.id === selectedId}
              onSelect={() => {
                setSelectedId(conversation.id);
                setThreadOpen(true);
              }}
            />
          ))}
          {conversations.hasNextPage && (
            <Button
              variant="ghost"
              size="sm"
              disabled={conversations.isFetchingNextPage}
              onClick={() => void conversations.fetchNextPage()}
            >
              {conversations.isFetchingNextPage ? "Loading…" : "Load more"}
            </Button>
          )}
        </div>
      </div>

      <div className={cn("min-w-0 flex-1 md:block", showThread ? "block" : "hidden")}>
        {selected ? (
          <ThreadPanel key={selected.id} conversation={selected} onBack={() => setThreadOpen(false)} />
        ) : (
          <div className="grid h-full place-items-center p-6 text-center text-sm text-muted-foreground">
            Choose a conversation to read it.
          </div>
        )}
      </div>
    </div>
  );
}
