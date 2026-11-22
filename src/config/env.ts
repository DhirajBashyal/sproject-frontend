import { z } from "zod";

const schema = z.object({
  VITE_APP_NAME: z.string().min(1).default("NepaEducation"),
  VITE_API_BASE_URL: z.url(),
  VITE_WIDGET_API_KEY: z.string().default(""),
  VITE_WIDGET_CHATBOT_ID: z.string().default(""),
  // Pre-filled in the Facebook and Instagram connect forms, and sent with "Login with Instagram".
  VITE_DEFAULT_CHATBOT_ID: z.string().default("b9c2ba03-b80b-4268-a24f-102982aa4c1a"),
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
  defaultChatbotId: parsed.data.VITE_DEFAULT_CHATBOT_ID,
};
