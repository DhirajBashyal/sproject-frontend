import { z } from "zod";

const schema = z.object({
  VITE_APP_NAME: z.string().min(1).default("Social Inbox"),
  VITE_API_BASE_URL: z.url(),
  VITE_WIDGET_API_KEY: z.string().default(""),
  VITE_WIDGET_CHATBOT_ID: z.string().default(""),
});

const parsed = schema.safeParse(import.meta.env);

if (!parsed.success) {
  throw new Error(`Invalid environment values: ${z.prettifyError(parsed.error)}`);
}

export const env = {
  appName: parsed.data.VITE_APP_NAME,
  apiBaseUrl: parsed.data.VITE_API_BASE_URL.replace(/\/$/, ""),
  widgetApiKey: parsed.data.VITE_WIDGET_API_KEY,
  widgetChatbotId: parsed.data.VITE_WIDGET_CHATBOT_ID,
};
