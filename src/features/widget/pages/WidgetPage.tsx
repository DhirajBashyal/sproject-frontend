import { Link } from "react-router";
import { Alert } from "@/components/ui/alert";
import { toApiError } from "@/lib/axios";
import { widgetConfigured } from "../api/widget.api";
import { ChatWidget } from "../components/ChatWidget";
import { useWidgetSettings } from "../hooks/useWidgetSettings";

export function WidgetPage() {
  const settings = useWidgetSettings();

  return (
    <div className="mx-auto grid max-w-4xl gap-5 p-6">
      <title>Chat Widget</title>
      <p className="text-sm text-muted-foreground">
        <Link to="/channels" className="underline">
          All Channels
        </Link>{" "}
        / Chat Widget
      </p>
      <div>
        <h1 className="text-2xl font-bold">Chat Widget</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preview the chat window your website visitors will see. Messages here go to your real chatbot.
        </p>
      </div>

      {!widgetConfigured && (
        <Alert variant="warning">
          Add VITE_WIDGET_API_KEY and VITE_WIDGET_CHATBOT_ID to your env file, then restart the dev server.
        </Alert>
      )}
      {settings.error && <Alert>{toApiError(settings.error).detail}</Alert>}
      {settings.isFetching && <p className="text-sm text-muted-foreground">Loading widget settings…</p>}
      {settings.data && (
        <div className={settings.data.widget_alignment === "left" ? "flex justify-start" : "flex justify-end"}>
          <ChatWidget settings={settings.data} />
        </div>
      )}
    </div>
  );
}
