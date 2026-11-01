import { useQueryClient } from "@tanstack/react-query";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { toApiError } from "@/lib/axios";
import { channelsApi } from "../api/channels.api";
import { upsertChannels } from "../hooks/useChannels";
import type { Platform } from "../types";
import { PLATFORM_LABEL } from "./PlatformIcon";

interface Field {
  id: string;
  label: string;
  hint?: string;
  secret?: boolean;
  optional?: boolean;
}

const chatbot: Field = {
  id: "chatbot_id",
  label: "Chatbot ID (optional)",
  hint: "Leave empty to connect without auto-replies.",
  optional: true,
};

const fields: Record<Platform, Field[]> = {
  facebook: [
    { id: "page_id", label: "Page ID" },
    { id: "access_token", label: "Page access token", secret: true },
    chatbot,
  ],
  instagram: [{ id: "access_token", label: "Access token", secret: true }, chatbot],
  whatsapp: [
    { id: "phone_number_id", label: "Phone number ID" },
    { id: "waba_id", label: "WhatsApp Business Account ID", hint: "Needed to receive messages." },
    {
      id: "access_token",
      label: "Access token",
      hint: "Use a permanent System User token. Temporary tokens expire in 24 hours.",
      secret: true,
    },
    chatbot,
  ],
};

interface ConnectState {
  error?: string;
  fields?: Record<string, string>;
  values?: Record<string, string>;
}

interface ConnectWithTokenDialogProps {
  platform: Platform;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectWithTokenDialog({ platform, open, onOpenChange }: ConnectWithTokenDialogProps) {
  const queryClient = useQueryClient();

  const [state, formAction] = useActionState(
    async (_previous: ConnectState, form: FormData): Promise<ConnectState> => {
      const body = Object.fromEntries(
        fields[platform].flatMap(({ id }) => {
          const value = String(form.get(id) ?? "").trim();
          return value ? [[id, value]] : [];
        }),
      );
      try {
        upsertChannels(queryClient, [await channelsApi.connectWithToken(platform, body)]);
        onOpenChange(false);
        return {};
      } catch (error) {
        const apiError = toApiError(error);
        // React resets the form after an action, so keep what was typed, except the token.
        const { access_token: _token, ...values } = body;
        return { error: apiError.detail, fields: apiError.fieldErrors, values };
      }
    },
    {},
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Connect {PLATFORM_LABEL[platform]}</DialogTitle>
        <DialogDescription>Enter the details from your Meta account.</DialogDescription>
        <form action={formAction} className="grid gap-4">
          {fields[platform].map(({ id, label, hint, secret, optional }) => (
            <FormField
              key={id}
              id={id}
              label={label}
              hint={hint}
              error={state.fields?.[id]}
              defaultValue={state.values?.[id]}
              type={secret ? "password" : "text"}
              autoComplete="off"
              required={!optional}
            />
          ))}
          {state.error && <Alert>{state.error}</Alert>}
          <SubmitButton pendingText="Connecting…">Connect</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
