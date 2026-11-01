// @vitest-environment jsdom
import type { AxiosAdapter, AxiosError } from "axios";
import { AxiosError as AxiosErrorClass } from "axios";
import { beforeEach, expect, test, vi } from "vitest";

vi.stubEnv("VITE_API_BASE_URL", "http://api.test");

const { ApiError, http } = await import("./axios");
const { refreshClient } = await import("@/services/auth.service");
const { readStoredTokens, useAuthStore } = await import("@/stores/auth.store");

const pair = (n: number) =>
  ({ access_token: `a${n}`, refresh_token: `r${n}`, token_type: "bearer", expires_in: 900 }) as const;

const respond = (status: number, data: unknown): AxiosAdapter =>
  async (config) => {
    const response = { status, data, statusText: "", headers: {}, config };
    if (status < 400) return response;
    throw new AxiosErrorClass("failed", undefined, config, undefined, response) as AxiosError;
  };

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ tokens: null });
});

test("parallel 401s share one refresh, then retry", async () => {
  useAuthStore.getState().setTokens(pair(1));
  const refresh = vi.fn(respond(200, pair(2)));
  refreshClient.defaults.adapter = refresh;
  http.defaults.adapter = (config) =>
    String(config.headers.Authorization) === "Bearer a2"
      ? respond(200, { ok: 1 })(config)
      : respond(401, { detail: "expired" })(config);

  const results = await Promise.all([http.get("/x"), http.get("/y"), http.get("/z")]);

  expect(refresh).toHaveBeenCalledTimes(1);
  expect(results.map((result) => result.data)).toEqual([{ ok: 1 }, { ok: 1 }, { ok: 1 }]);
  expect(readStoredTokens()?.refresh_token).toBe("r2");
});

test("reuses a token another tab already refreshed", async () => {
  useAuthStore.getState().setTokens(pair(2));
  const refresh = vi.fn(respond(401, {}));
  refreshClient.defaults.adapter = refresh;
  let first = true;
  http.defaults.adapter = (config) => {
    if (first) {
      first = false;
      useAuthStore.getState().setTokens(pair(3));
      return respond(401, {})(config);
    }
    return respond(200, { ok: 1 })(config);
  };

  await http.get("/x");
  expect(refresh).not.toHaveBeenCalled();
});

test("a failed refresh signs out", async () => {
  useAuthStore.getState().setTokens(pair(1));
  refreshClient.defaults.adapter = respond(401, { detail: "used" });
  http.defaults.adapter = respond(401, { detail: "expired" });

  await expect(http.get("/x")).rejects.toBeInstanceOf(ApiError);
  expect(readStoredTokens()).toBeNull();
  expect(useAuthStore.getState().tokens).toBeNull();
});

test("a login 401 keeps its message and never refreshes", async () => {
  const refresh = vi.fn(respond(200, pair(2)));
  refreshClient.defaults.adapter = refresh;
  http.defaults.adapter = respond(401, { detail: "Invalid email or password" });

  await expect(http.post("/login", {}, { skipAuth: true })).rejects.toThrow("Invalid email");
  expect(refresh).not.toHaveBeenCalled();
});

test("maps 422 to field errors and 429 to a friendly message", async () => {
  http.defaults.adapter = respond(422, {
    detail: [{ loc: ["body", "email"], msg: "bad email", type: "value_error" }],
  });
  const invalid = await http.post("/r", {}, { skipAuth: true }).catch((error: unknown) => error);
  expect((invalid as InstanceType<typeof ApiError>).fieldErrors).toEqual({ email: "bad email" });

  http.defaults.adapter = respond(429, { detail: "Rate limit exceeded" });
  await expect(http.get("/x", { skipAuth: true })).rejects.toThrow("Wait a minute");
});
