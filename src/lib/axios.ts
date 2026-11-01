import axios, { type InternalAxiosRequestConfig } from "axios";
import { env } from "@/config/env";
import { refreshAccessToken } from "@/services/auth.service";
import { readStoredTokens } from "@/stores/auth.store";
import type { ValidationIssue } from "@/types/api.types";

declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuth?: boolean; // login, register and the like
  }
}

type RetriableConfig = InternalAxiosRequestConfig & { retried?: boolean };

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
    readonly issues: ValidationIssue[] = [],
  ) {
    super(detail);
  }

  /** Maps a 422 to { email: "value is not a valid email address" }. */
  get fieldErrors(): Record<string, string> {
    return Object.fromEntries(this.issues.map((issue) => [String(issue.loc.at(-1)), issue.msg]));
  }
}

function friendlyDetail(status: number, detail: unknown) {
  if (status === 429) return "Too many requests. Wait a minute and try again.";
  return typeof detail === "string" ? detail : `Request failed (${status}).`;
}

export function toApiError(error: unknown) {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error) && error.response) {
    const { status, data } = error.response;
    const detail: unknown = (data as { detail?: unknown } | undefined)?.detail;
    if (Array.isArray(detail)) {
      return new ApiError(status, "Check the highlighted fields.", detail as ValidationIssue[]);
    }
    return new ApiError(status, friendlyDetail(status, detail));
  }
  return new ApiError(0, "Could not reach the server. Try again.");
}

export const http = axios.create({ baseURL: env.apiBaseUrl });

http.interceptors.request.use((config) => {
  const token = config.skipAuth ? undefined : readStoredTokens()?.access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(undefined, async (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401 && error.config) {
    const config = error.config as RetriableConfig;
    const sent = String(config.headers.Authorization ?? "").replace("Bearer ", "");
    if (sent && !config.retried) {
      config.retried = true;
      try {
        await refreshAccessToken(sent);
      } catch (refreshError) {
        throw toApiError(refreshError);
      }
      return http(config);
    }
  }
  throw toApiError(error);
});
