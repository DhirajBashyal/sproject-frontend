import { useQueryClient } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { toApiError } from "@/lib/axios";
import { loadFacebookSdk, type FacebookSdk } from "@/lib/facebookSdk";
import { channelsApi } from "../api/channels.api";
import {
  getEmbeddedSignupConfig,
  runEmbeddedSignup,
  SignupCancelledError,
  type EmbeddedSignupConfig,
} from "../api/whatsappSignup";
import { upsertChannels } from "../hooks/useChannels";
import type { Channel } from "../types";
import { PlatformIcon } from "./PlatformIcon";

interface WhatsAppConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onManual: () => void;
}

export function WhatsAppConnectDialog({ open, onOpenChange, onManual }: WhatsAppConnectDialogProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [setup, setSetup] = useState<{ sdk: FacebookSdk; config: EmbeddedSignupConfig } | null>(null);
  const [unconfigured, setUnconfigured] = useState(false);
  const [connected, setConnected] = useState<Channel | null>(null);
  const [chatbotId, setChatbotId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Load the SDK when the dialog opens, so the click can open Meta's popup without being blocked.
  useEffect(() => {
    if (!open || setup) return;
    let cancelled = false;
    getEmbeddedSignupConfig()
      .then(async (config) => {
        if (!config) return !cancelled && setUnconfigured(true);
        const sdk = await loadFacebookSdk(config.app_id, config.graph_api_version);
        if (!cancelled) setSetup({ sdk, config });
      })
      .catch((loadError: Error) => !cancelled && setError(loadError.message));
    return () => {
      cancelled = true;
    };
  }, [open, setup]);

  async function finish() {
    onOpenChange(false);
    setConnected(null);
    await navigate("/channels/whatsapp");
  }

  function connect() {
    if (!setup) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    runEmbeddedSignup(setup.sdk, setup.config.config_id)
      .then((result) =>
        channelsApi.whatsappEmbeddedSignup({ ...result, ...(chatbotId.trim() && { chatbot_id: chatbotId.trim() }) }),
      )
      .then(async (channel) => {
        upsertChannels(queryClient, [channel]);
        // Connected, but Meta refused to register the number. Keep the dialog open to explain.
        if (channel.config.register_error) setConnected(channel);
        else await finish();
      })
      .catch((caught: unknown) => {
        if (caught instanceof SignupCancelledError) return setNotice(caught.message);
        const apiError = toApiError(caught);
        if (apiError.status === 404 || apiError.status === 405) {
          return setError(
            "Meta approved the number, but the backend can't finish WhatsApp signup yet. Enter the details manually for now.",
          );
        }
        setError(apiError.status === 0 && caught instanceof Error ? caught.message : apiError.detail);
      })
      .finally(() => setBusy(false));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <div className="grid gap-3 border-b p-6">
          <div className="flex items-center gap-3">
            <PlatformIcon platform="whatsapp" className="size-12 shrink-0 rounded-lg" />
            <DialogTitle className="text-xl">Connect with WhatsApp Business</DialogTitle>
          </div>
          <DialogDescription>Connect your agent to WhatsApp and let it respond to messages.</DialogDescription>
        </div>

        <div className="grid gap-4 p-6">
          {connected ? (
            <>
              <Alert variant="warning">
                {connected.name} is connected, but Meta couldn't register the number: {connected.config.register_error}.
                This usually means the number already has a different two-step verification PIN.
              </Alert>
              <Button className="justify-self-center" onClick={() => void finish()}>
                Done
              </Button>
            </>
          ) : !unconfigured ? (
            <>
              <FormField
                id="whatsapp-chatbot"
                label="Chatbot ID (optional)"
                hint="Leave empty to connect without auto-replies."
                autoComplete="off"
                value={chatbotId}
                onChange={(event) => setChatbotId(event.target.value)}
              />
              <Button className="h-11 justify-self-center px-12" disabled={!setup || busy} onClick={connect}>
                {busy ? "Connecting…" : setup ? "Connect WhatsApp" : "Loading…"}
              </Button>
            </>
          ) : (
            <Alert variant="warning">
              Connecting through Meta isn't set up. Add WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID to the backend, or
              VITE_FACEBOOK_APP_ID and VITE_WHATSAPP_CONFIG_ID to this app's env file.
            </Alert>
          )}

          {notice && <Alert variant="info">{notice}</Alert>}
          {error && <Alert>{error}</Alert>}

          <p className="flex gap-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-5 shrink-0" />
            Your WhatsApp number must use a WhatsApp Business account before it can be connected.
          </p>
          <Button variant="ghost" size="sm" className="justify-self-center" onClick={onManual}>
            Enter details manually instead
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
