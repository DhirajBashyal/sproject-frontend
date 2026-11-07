import { cn } from "@/lib/utils";

export type InboxTab = "messages" | "comments";

const TABS: { id: InboxTab; label: string }[] = [
  { id: "messages", label: "Messages" },
  { id: "comments", label: "Comments" },
];

export function InboxTabs({ value, onChange }: { value: InboxTab; onChange: (tab: InboxTab) => void }) {
  return (
    <div role="tablist" aria-label="Inbox" className="grid grid-cols-2 gap-1 border-b p-2">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={value === id}
          onClick={() => onChange(id)}
          className={cn(
            "cursor-pointer rounded-md py-1.5 text-sm font-semibold",
            value === id ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-muted",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
