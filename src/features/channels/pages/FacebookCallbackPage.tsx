import { useQueryClient } from "@tanstack/react-query";
import { use, useActionState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Alert } from "@/components/ui/alert";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { toApiError } from "@/lib/axios";
import { channelsApi } from "../api/channels.api";
import { CallbackCard, CallbackFailure, CallbackShell } from "../components/CallbackShell";
import { upsertChannels } from "../hooks/useChannels";
import type { FacebookPage } from "../types";

// `state` works once and StrictMode renders twice, so the request is keyed
// outside React. Both renders then read the same promise.
const exchanges = new Map<string, Promise<FacebookPage[]>>();

function exchangeCode(code: string, state: string) {
  let exchange = exchanges.get(state);
  if (!exchange) {
    exchange = channelsApi.facebookCallback(code, state);
    exchanges.set(state, exchange);
  }
  return exchange;
}

interface PickerState {
  error?: string;
  pageIds?: string[];
  chatbotId?: string;
}

function PagePicker({ code, state }: { code: string; state: string }) {
  const pages = use(exchangeCode(code, state));
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [result, formAction] = useActionState(
    async (_previous: PickerState, form: FormData): Promise<PickerState> => {
      const pageIds = form.getAll("page_id").map(String);
      const chatbotId = String(form.get("chatbot_id")).trim() || undefined;
      if (pageIds.length === 0) return { error: "Choose at least one page.", chatbotId };
      try {
        upsertChannels(queryClient, await channelsApi.facebookConnectPages(pageIds, chatbotId));
        await navigate("/channels/facebook", { replace: true });
        return {};
      } catch (error) {
        return { error: toApiError(error).detail, pageIds, chatbotId };
      }
    },
    {},
  );

  if (pages.length === 0) return <CallbackFailure message="This Facebook account has no pages to connect." />;

  return (
    <CallbackCard>
      <title>Choose pages</title>
      <h1 className="text-lg font-bold">Choose pages to connect</h1>
      <form action={formAction} className="grid gap-4">
        <div className="grid gap-3">
          {pages.map((page) => (
            <label key={page.id} className="flex cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="page_id"
                value={page.id}
                defaultChecked={result.pageIds?.includes(page.id)}
                className="size-4 accent-primary"
              />
              <span className="min-w-0">
                <b className="font-medium">{page.name}</b>
                <small className="block text-muted-foreground">
                  {page.category}
                  {page.connected && " · Already connected"}
                </small>
              </span>
            </label>
          ))}
        </div>
        <FormField
          id="chatbot_id"
          label="Chatbot ID (optional)"
          hint="Leave empty to connect without auto-replies."
          autoComplete="off"
          defaultValue={result.chatbotId}
        />
        {result.error && <Alert>{result.error}</Alert>}
        <SubmitButton pendingText="Connecting…">Connect selected pages</SubmitButton>
      </form>
    </CallbackCard>
  );
}

export function FacebookCallbackPage() {
  const [params] = useSearchParams();
  const code = params.get("code");
  const state = params.get("state");

  if (!code || !state) return <CallbackFailure message="Facebook did not grant access." />;

  return (
    <CallbackShell loading="Loading your pages…">
      <PagePicker code={code} state={state} />
    </CallbackShell>
  );
}
