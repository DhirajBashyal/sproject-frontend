import { useQueryClient } from "@tanstack/react-query";
import { Filter, MessagesSquare, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PLATFORM_LABEL } from "@/features/channels/components/PlatformIcon";
import { PLATFORMS, type Platform } from "@/features/channels/types";
import { toApiError } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { inboxAvailable } from "../api/inbox.api";
import { ConversationRow } from "../components/ConversationRow";
import { ThreadPanel } from "../components/ThreadPanel";
import { useConversations } from "../hooks/useInbox";

const selectClass = "rounded-md bg-transparent py-1 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary";

export function InboxPage() {
  const queryClient = useQueryClient();
  const conversations = useConversations();
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [threadOpen, setThreadOpen] = useState(false);

  const visible = useMemo(() => {
    const direction = sort === "newest" ? -1 : 1;
    return (conversations.data ?? [])
      .filter((conversation) => platform === "all" || conversation.channel.platform === platform)
      .sort((a, b) => direction * a.last_message.at.localeCompare(b.last_message.at));
  }, [conversations.data, platform, sort]);

  const selected = visible.find(({ id }) => id === selectedId) ?? visible[0];

  if (!inboxAvailable) {
    return (
      <div className="mx-auto grid max-w-xl gap-3 p-6 text-center">
        <title>Inbox</title>
        <MessagesSquare className="mx-auto size-8 text-muted-foreground" />
        <h1 className="text-xl font-bold">The inbox isn't available yet</h1>
        <p className="text-sm text-muted-foreground">
          The backend doesn't provide conversations yet. Set VITE_INBOX_USE_MOCK=true to preview this page
          with sample data.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <title>Inbox</title>
      <Alert variant="info" className="rounded-none">
        Sample conversations. Replies here aren't sent to real customers.
      </Alert>
      <div className="flex min-h-0 flex-1">
        <div
          className={cn(
            "w-full shrink-0 flex-col border-r md:flex md:w-[340px]",
            threadOpen ? "hidden" : "flex",
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
            <select
              aria-label="Sort conversations"
              className={selectClass}
              value={sort}
              onChange={(event) => setSort(event.target.value as "newest" | "oldest")}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
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
                onClick={() => void queryClient.invalidateQueries({ queryKey: ["conversations"] })}
              >
                <RefreshCw />
              </Button>
            </div>
          </div>

          <p className="flex items-center gap-2 px-4 pt-3 pb-1 text-xs text-muted-foreground">
            <MessagesSquare className="size-3.5" /> All Conversation
          </p>

          <div className="grid min-h-0 flex-1 content-start gap-0.5 overflow-y-auto px-2 pb-2">
            {conversations.isPending && <p className="p-3 text-sm text-muted-foreground">Loading conversations…</p>}
            {conversations.error && <Alert>{toApiError(conversations.error).detail}</Alert>}
            {conversations.data && visible.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">No conversations match this filter.</p>
            )}
            {visible.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                selected={conversation.id === selected?.id}
                onSelect={() => {
                  setSelectedId(conversation.id);
                  setThreadOpen(true);
                }}
              />
            ))}
          </div>
        </div>

        <div className={cn("min-w-0 flex-1 md:block", threadOpen ? "block" : "hidden")}>
          {selected ? (
            <ThreadPanel key={selected.id} conversation={selected} onBack={() => setThreadOpen(false)} />
          ) : (
            <p className="p-6 text-sm text-muted-foreground">Choose a conversation to read it.</p>
          )}
        </div>
      </div>
    </div>
  );
}
