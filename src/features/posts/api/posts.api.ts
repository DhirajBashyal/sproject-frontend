import { http } from "@/lib/axios";
import type { GeneratePostRequest, PublishPostRequest, PublishResult } from "../types";

export const postsApi = {
  // Gemini drafts the text. Nothing is published. Can take 10–30 seconds.
  generate: (body: GeneratePostRequest) =>
    http.post<{ text: string }>("/api/posts/generate", body).then((r) => r.data.text),

  // Each channel gets its own result, so one failure doesn't stop the others.
  publish: (body: PublishPostRequest) =>
    http.post<{ results: PublishResult[] }>("/api/posts/publish", body).then((r) => r.data.results),
};
