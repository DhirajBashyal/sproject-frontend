import { env } from "@/config/env";
import { http } from "@/lib/axios";
import type { FacebookSdk } from "@/lib/facebookSdk";

export interface EmbeddedSignupConfig {
  app_id: string;
  config_id: string;
  graph_api_version: string; // e.g. "v21.0"
}

// Used when the backend route below isn't deployed yet.
const envConfig: EmbeddedSignupConfig | null =
  env.facebookAppId && env.whatsappConfigId
    ? { app_id: env.facebookAppId, config_id: env.whatsappConfigId, graph_api_version: "v21.0" }
    : null;

/** The backend's settings win, so the IDs live in one place. Falls back to the env file. */
export async function getEmbeddedSignupConfig(): Promise<EmbeddedSignupConfig | null> {
  try {
    const { data } = await http.get<EmbeddedSignupConfig>("/api/channels/whatsapp/embedded-signup/config");
    return data;
  } catch {
    return envConfig;
  }
}

export interface EmbeddedSignupResult {
  code: string; // valid for about 30 seconds, so send it to the backend straight away
  waba_id: string;
  phone_number_id: string;
}

export class SignupCancelledError extends Error {}

// Meta sends the chosen account and number as a message, and the code through the login callback.
const ID_WAIT_MS = 5_000;

function fromFacebook(origin: string) {
  try {
    return /(^|\.)facebook\.com$/.test(new URL(origin).hostname);
  } catch {
    return false;
  }
}

/** Opens Meta's WhatsApp signup popup. Call it directly from a click handler. */
export function runEmbeddedSignup(sdk: FacebookSdk, configId: string) {
  return new Promise<EmbeddedSignupResult>((resolve, reject) => {
    let code: string | undefined;
    let ids: { waba_id: string; phone_number_id: string } | undefined;
    let settled = false;

    const settle = (error?: Error) => {
      if (settled || (!error && !(code && ids))) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      if (error) reject(error);
      else if (code && ids) resolve({ code, ...ids });
    };

    function onMessage(event: MessageEvent) {
      if (!fromFacebook(event.origin)) return;
      let message: { type?: string; event?: string; data?: Record<string, string | undefined> };
      try {
        message = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      if (message?.type !== "WA_EMBEDDED_SIGNUP") return;

      if (message.event === "CANCEL") {
        // A cancel can carry an error, for example when the chosen number can't be used.
        const reason = message.data?.error_message;
        settle(
          reason
            ? new Error(`WhatsApp signup failed: ${reason}`)
            : new SignupCancelledError("WhatsApp signup was cancelled."),
        );
      } else if (message.event === "ERROR") {
        settle(new Error(message.data?.error_message ?? "Meta reported an error during WhatsApp signup."));
      } else if (message.data?.waba_id && message.data.phone_number_id) {
        ids = { waba_id: message.data.waba_id, phone_number_id: message.data.phone_number_id };
        settle();
      }
    }

    window.addEventListener("message", onMessage);
    sdk.login(
      (response) => {
        code = response.authResponse?.code;
        if (!code) return settle(new SignupCancelledError("WhatsApp signup was cancelled."));
        settle();
        setTimeout(
          () => settle(new Error("Meta didn't say which WhatsApp number you chose. Try again.")),
          ID_WAIT_MS,
        );
      },
      {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
        extras: { setup: {}, featureType: "", sessionInfoVersion: "3" },
      },
    );
  });
}
