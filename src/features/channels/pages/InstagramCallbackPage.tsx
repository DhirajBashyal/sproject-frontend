import { useQueryClient } from "@tanstack/react-query";
import { use } from "react";
import { Link, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { channelsApi } from "../api/channels.api";
import { CallbackCard, CallbackFailure, CallbackShell } from "../components/CallbackShell";
import { upsertChannels } from "../hooks/useChannels";
import type { Channel } from "../types";

// `state` works once and StrictMode renders twice, so the request is keyed outside React.
const connections = new Map<string, Promise<Channel>>();

function ConnectResult({ code, state }: { code: string; state: string }) {
  const queryClient = useQueryClient();
  let connection = connections.get(state);
  if (!connection) {
    connection = channelsApi.instagramConnect(code, state).then((channel) => {
      upsertChannels(queryClient, [channel]);
      return channel;
    });
    connections.set(state, connection);
  }
  const channel = use(connection);

  return (
    <CallbackCard>
      <title>Instagram connected</title>
      <h1 className="text-lg font-bold">@{channel.name} is connected</h1>
      {channel.token_expires_at && (
        <p className="text-sm text-muted-foreground">
          The connection lasts until {new Date(channel.token_expires_at).toLocaleDateString()}. Reconnect
          before then to extend it.
        </p>
      )}
      <Button asChild>
        <Link to="/channels/instagram">Go to Instagram channels</Link>
      </Button>
    </CallbackCard>
  );
}

export function InstagramCallbackPage() {
  const [params] = useSearchParams();
  // Instagram sometimes appends #_ to the redirect URL.
  const code = params.get("code")?.replace(/#_$/, "");
  const state = params.get("state");

  if (!code || !state) return <CallbackFailure message="Instagram did not grant access." />;

  return (
    <CallbackShell loading="Connecting your Instagram account…">
      <ConnectResult code={code} state={state} />
    </CallbackShell>
  );
}
