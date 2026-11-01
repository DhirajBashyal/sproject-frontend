import { useOptimistic, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toApiError } from "@/lib/axios";
import { widgetApi } from "../api/widget.api";
import type { ChatTurn, WidgetSettings } from "../types";

export function ChatWidget({ settings }: { settings: WidgetSettings }) {
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [turns, addTurn] = useOptimistic(history, (current, content: string): ChatTurn[] => [
    ...current,
    { role: "user", content },
  ]);

  async function ask(query: string) {
    const text = query.trim();
    if (!text) return;

    setError(null);
    setWaiting(true);
    addTurn(text);
    setDraft("");
    try {
      const answer = await widgetApi.ask(text);
      setHistory(answer.history); // the server's history is the source of truth
    } catch (caught) {
      setDraft(text);
      setError(toApiError(caught).detail);
    } finally {
      setWaiting(false);
    }
  }

  return (
    <section
      aria-label="Chat"
      className="flex h-[480px] w-full max-w-sm flex-col overflow-hidden rounded-xl border"
      style={{ background: settings.background_color, color: "#17242d" }}
    >
      <div className="bg-[#0a5fa8] px-4 py-3 font-semibold text-white">Chat with us</div>

      <ol className="grid min-h-0 flex-1 content-start gap-2 overflow-y-auto p-3 text-sm" aria-live="polite">
        <li className="w-fit max-w-[85%] rounded-xl px-3 py-2" style={{ background: settings.bot_bubble_color }}>
          {settings.initial_message}
        </li>
        {turns.map((turn, index) =>
          // Rendered as text, so model output can never inject markup.
          turn.role === "user" ? (
            <li
              key={index}
              className="ml-auto w-fit max-w-[85%] rounded-xl px-3 py-2 break-words text-white"
              style={{ background: settings.user_bubble_color }}
            >
              {turn.content}
            </li>
          ) : (
            <li
              key={index}
              className="w-fit max-w-[85%] rounded-xl px-3 py-2 break-words"
              style={{ background: settings.bot_bubble_color }}
            >
              {turn.content}
            </li>
          ),
        )}
        {waiting && <li className="text-xs opacity-70">Typing…</li>}
      </ol>

      {turns.length === 0 && settings.faqs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3 pb-2">
          {settings.faqs.map((faq) => (
            <form key={faq} action={() => ask(faq)}>
              <button className="cursor-pointer rounded-full border border-[#0a5fa8] px-2.5 py-1 text-left text-xs text-[#0a5fa8]">
                {faq}
              </button>
            </form>
          ))}
        </div>
      )}

      {error && <Alert className="mx-3 mb-2">{error}</Alert>}

      <form action={() => ask(draft)} className="flex gap-2 border-t border-black/10 p-3">
        <Label htmlFor="chat-query" className="sr-only">
          Your question
        </Label>
        <Input
          id="chat-query"
          placeholder="Your question"
          autoComplete="off"
          required
          className="bg-white text-[#17242d] placeholder:text-[#566772]"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="submit" disabled={waiting} className="bg-[#0a5fa8] text-white">
          Send
        </Button>
      </form>
    </section>
  );
}
