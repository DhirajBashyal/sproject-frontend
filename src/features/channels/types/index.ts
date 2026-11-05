export type Platform = "facebook" | "instagram" | "whatsapp";

export const PLATFORMS: Platform[] = ["instagram", "facebook", "whatsapp"];

export function isPlatform(value: string | undefined): value is Platform {
  return PLATFORMS.includes(value as Platform);
}

export interface Channel {
  id: string;
  platform: Platform;
  external_id: string; // the ID used in every channel path
  name: string;
  chatbot_id: string | null; // null = connected, no auto-replies
  is_active: boolean; // false after disconnect
  token_expires_at: string | null;
  config: Record<string, string | undefined>;
  created_at: string;
  updated_at: string;
}

export interface ChannelStatus {
  external_id: string;
  is_active: boolean;
  token_valid: boolean;
  webhook_subscribed: boolean | null; // null = could not be checked
  token_expires_at: string | null;
  error: string | null;
}

export interface ChannelDetails {
  channel: Channel;
  details: Record<string, unknown>;
}

export interface WebhookCheck {
  subscribed: boolean | null; // null = couldn't be determined
  subscribed_fields: string[];
  detail: string | null;
}

export interface FacebookPage {
  id: string;
  name: string;
  category: string;
  picture_url: string;
  connected: boolean;
}

export interface SendTextResponse {
  message_id: string;
  recipient_id: string;
}
