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

const PIN_PATTERN = /^\d{6}$/;

export function WhatsAppConnectDialog({ open, onOpenChange, onManual }: WhatsAppConnectDialogProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [setup, setSetup] = useState<{ sdk: FacebookSdk; config: EmbeddedSignupConfig } | null>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [chatbotId, setChatbotId] = useState("");
  const [pin, setPin] = useState("");
  const [connected, setConnected] = useState<Channel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Load the config and SDK when the dialog opens, so the click can open Meta's popup without being blocked.
  useEffect(() => {
    if (!open || setup || unavailable) return;
    let cancelled = false;
    getEmbeddedSignupConfig()
      .then(async (result) => {
        if ("unavailable" in result) return !cancelled && setUnavailable(result.unavailable);
        const sdk = await loadFacebookSdk(result.config.app_id, result.config.graph_api_version);
        if (!cancelled) setSetup({ sdk, config: result.config });
      })
      .catch((loadError: Error) => !cancelled && setError(loadError.message));
    return () => {
      cancelled = true;
    };
  }, [open, setup, unavailable]);

  function close() {
    onOpenChange(false);
    setConnected(null);
    setPin("");
    setError(null);
    setNotice(null);
  }

  async function finish() {
    close();
    await navigate("/channels/whatsapp");
  }

  const pinInvalid = pin !== "" && !PIN_PATTERN.test(pin);

  function connect() {
    if (!setup || pinInvalid) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    runEmbeddedSignup(setup.sdk, setup.config.config_id)
      .then((result) =>
        channelsApi.whatsappEmbeddedSignup({
          ...result,
          ...(chatbotId.trim() && { chatbot_id: chatbotId.trim() }),
          ...(pin && { pin }),
        }),
      )
      .then(async (channel) => {
        upsertChannels(queryClient, [channel]);
        // Stay open to show a registration problem, or the PIN the owner must keep.
        if (channel.config.register_error || channel.config.two_step_pin) {
          setConnected(channel);
          setPin("");
        } else {
          await finish();
        }
      })
      .catch((caught: unknown) => {
        if (caught instanceof SignupCancelledError) return setNotice(caught.message);
        const apiError = toApiError(caught);
        setError(apiError.status === 0 && caught instanceof Error ? caught.message : apiError.detail);
      })
      .finally(() => setBusy(false));
  }

  const registerError = connected?.config.register_error;
  const keptPin = connected?.config.two_step_pin;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <div className="grid gap-3 border-b p-6">
          <div className="flex items-center gap-3">
            <PlatformIcon platform="whatsapp" className="size-12 shrink-0 rounded-lg" />
            <DialogTitle className="text-xl">Connect with WhatsApp Business</DialogTitle>
          </div>
          <DialogDescription>Connect your agent to WhatsApp and let it respond to messages.</DialogDescription>
        </div>

        <div className="grid gap-4 p-6">
          {connected && keptPin && !registerError ? (
            <>
              <Alert variant="info">
                {connected.name} is connected. Its two-step verification PIN is{" "}
                <b className="font-mono tracking-widest">{keptPin}</b>. Save it somewhere safe: you'll need it to
                move this number, and it won't be shown again.
              </Alert>
              <Button className="justify-self-center" onClick={() => void finish()}>
                I've saved the PIN
              </Button>
            </>
          ) : unavailable ? (
            <Alert variant="warning">{unavailable} Enter the number's details manually instead.</Alert>
          ) : (
            <>
              {registerError && connected && (
                <Alert variant="warning">
                  {connected.name} is connected, but Meta couldn't register the number for sending: {registerError}.
                  If this number already has a two-step verification PIN, enter it and connect again.
                </Alert>
              )}
              <FormField
                id="whatsapp-chatbot"
                label="Chatbot ID (optional)"
                hint="Leave empty to connect without auto-replies."
                autoComplete="off"
                value={chatbotId}
                onChange={(event) => setChatbotId(event.target.value)}
              />
              {registerError && (
                <FormField
                  id="whatsapp-pin"
                  label="Two-step verification PIN"
                  hint="The 6-digit PIN already set for this number."
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={6}
                  value={pin}
                  error={pinInvalid ? "Enter exactly 6 digits." : undefined}
                  onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
                />
              )}
              <div className="flex flex-wrap justify-center gap-2">
                <Button className="h-11 px-12" disabled={!setup || busy || pinInvalid} onClick={connect}>
                  {busy ? "Connecting…" : !setup ? "Loading…" : registerError ? "Connect again" : "Connect WhatsApp"}
                </Button>
                {registerError && (
                  <Button variant="outline" className="h-11" onClick={() => void finish()}>
                    Done
                  </Button>
                )}
              </div>
            </>
          )}

          {notice && <Alert variant="info">{notice}</Alert>}
          {error && <Alert>{error}</Alert>}

          <p className="flex gap-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-5 shrink-0" />
            Your WhatsApp number must use a WhatsApp Business account before it can be connected.
          </p>
          {!connected && (
            <Button variant={unavailable ? "default" : "ghost"} size="sm" className="justify-self-center" onClick={onManual}>
              Enter details manually instead
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
