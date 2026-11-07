import { useSearchParams } from "react-router";
import { CommentsView } from "../components/CommentsView";
import { InboxTabs, type InboxTab } from "../components/InboxTabs";
import { MessagesView } from "../components/MessagesView";

export function InboxPage() {
  const [params, setParams] = useSearchParams();
  const tab: InboxTab = params.get("tab") === "comments" ? "comments" : "messages";
  const tabs = (
    <InboxTabs
      value={tab}
      onChange={(next) => setParams(next === "comments" ? { tab: "comments" } : {}, { replace: true })}
    />
  );

  return (
    <>
      <title>{tab === "comments" ? "Comments" : "Inbox"}</title>
      {tab === "comments" ? <CommentsView tabs={tabs} /> : <MessagesView tabs={tabs} />}
    </>
  );
}
