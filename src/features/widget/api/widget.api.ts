import axios from "axios";
import { env } from "@/config/env";
import { toApiError } from "@/lib/axios";
import { WIDGET_SESSION_KEY } from "@/lib/constants";
import type { ChatResponse, WidgetSettings } from "../types";

// Uses its own client: the widget authenticates with a key, never the user's session.
const widgetClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { "X-API-Key": env.widgetApiKey, "chatbot-id": env.widgetChatbotId },
});

export const widgetConfigured = Boolean(env.widgetApiKey && env.widgetChatbotId);

export const widgetApi = {
  async config() {
    try {
      const { data } = await widgetClient.get<{ chat_interface_settings: WidgetSettings }>(
        "/api/public/chat/config",
      );
      return data.chat_interface_settings;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async ask(query: string) {
    const sessionId = sessionStorage.getItem(WIDGET_SESSION_KEY);
    try {
      const response = await widgetClient.post<ChatResponse>("/api/public/chat", null, {
        params: { query },
        headers: sessionId ? { "session-id": sessionId } : undefined,
      });
      // The browser only exposes this header if the API lists it in
      // Access-Control-Expose-Headers.
      const nextSession: unknown = response.headers["x-session-id"];
      if (typeof nextSession === "string") sessionStorage.setItem(WIDGET_SESSION_KEY, nextSession);
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },
};
