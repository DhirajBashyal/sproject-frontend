import type { Platform } from "@/features/channels/types";

export type PostPlatform = Exclude<Platform, "whatsapp">;

export interface GeneratePostRequest {
  prompt: string;
  platform?: PostPlatform; // leave out to write for both
  tone?: string;
  language?: string;
  channel_id?: string;
}

export interface PublishPostRequest {
  channel_ids: string[];
  text: string;
  image_url?: string; // public https URL; Instagram requires one
  link?: string; // Facebook only
}

export interface PublishResult {
  channel_id: string;
  platform: PostPlatform;
  channel_name: string | null;
  status: "published" | "failed";
  post_id: string | null;
  permalink_url: string | null;
  error: string | null; // Meta's reason when failed
}

export const PROMPT_MAX = 2000;
export const POST_TEXT_MAX = 2200;
