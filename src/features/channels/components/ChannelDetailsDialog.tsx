import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toApiError } from "@/lib/axios";
import { channelsApi } from "../api/channels.api";
import { useChannelActions, useChannelStatus } from "../hooks/useChannels";
import type { Channel } from "../types";
import { PLATFORM_LABEL } from "./PlatformIcon";

const DAY_MS = 86_400_000;

function ProfileData({ channel }: { channel: Channel }) {
  const { data, error, isFetching, refetch } = useQuery({
    queryKey: ["channel-details", channel.platform, channel.external_id],
    queryFn: () => channelsApi.details(channel),
    enabled: false,
  });

  if (!data) {
    return (
      <div className="grid gap-2">
        <Button variant="outline" size="sm" disabled={isFetching} onClick={() => void refetch()}>
          {isFetching ? "Loading…" : "Show profile data"}
        </Button>
        {error && <Alert>{toApiError(error).detail}</Alert>}
      </div>
    );
  }

  const rows = Object.entries(data.details).filter(([, value]) => typeof value !== "object");
  return (
    <dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-x-3 gap-y-1 text-sm">
      {rows.map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="text-muted-foreground">{key.replaceAll("_", " ")}</dt>
          <dd className="break-words">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function WebhookCheckButton({ channel }: { channel: Channel }) {
  const { data, error, isFetching, refetch } = useQuery({
    queryKey: ["webhook-check", channel.platform, channel.external_id],
    queryFn: () => channelsApi.webhookCheck(channel),
    enabled: false,
  });

  return (
    <div className="grid gap-2">
      <Button variant="outline" size="sm" disabled={isFetching} onClick={() => void refetch()}>
        {isFetching ? "Checking…" : "Check message delivery"}
      </Button>
      {error && <Alert>{toApiError(error).detail}</Alert>}
      {data &&
        (data.subscribed ? (
          <Alert variant="info">Receiving messages. Subscribed to: {data.subscribed_fields.join(", ")}.</Alert>
        ) : (
          <Alert variant="warning">
            {data.detail ??
              (data.subscribed === false
                ? "Not subscribed to messages. Reconnect to fix it."
                : "Couldn't check message delivery.")}
          </Alert>
        ))}
    </div>
  );
}

export function ChannelDetailsDialog({ channel, onClose }: { channel: Channel; onClose: () => void }) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [token, setToken] = useState("");
  const status = useChannelStatus(channel, true);
  const { reconnect, disconnect, remove, updateToken } = useChannelActions(channel);

  const pending = reconnect.isPending || disconnect.isPending || remove.isPending || updateToken.isPending;
  const failure = reconnect.error ?? disconnect.error ?? remove.error ?? updateToken.error ?? status.error;
  const expiry = status.data?.token_expires_at ?? channel.token_expires_at;
  const expiresSoon = expiry !== null && new Date(expiry).getTime() - Date.now() < 7 * DAY_MS;
  const webhook = status.data?.webhook_subscribed;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle>{channel.name}</DialogTitle>
        <DialogDescription>
          {PLATFORM_LABEL[channel.platform]} · ID {channel.external_id}
        </DialogDescription>

        {confirmRemove ? (
          <div className="grid gap-3">
            <p className="text-sm">
              Remove {channel.name}? This deletes the channel, and you'll need to connect it again to
              use it. Disconnect keeps it listed so you can reconnect later.
            </p>
            {remove.error && <Alert>{toApiError(remove.error).detail}</Alert>}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setConfirmRemove(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={pending}
                onClick={() => remove.mutate(undefined, { onSuccess: onClose })}
              >
                {remove.isPending ? "Removing…" : "Remove"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-sm">
              <span>Connection</span>
              {status.isPending ? (
                <Badge>Checking…</Badge>
              ) : status.data?.token_valid ? (
                <Badge variant="success">Working</Badge>
              ) : (
                <Badge variant="danger">{status.data ? "Needs updating" : "Unknown"}</Badge>
              )}
              <span>Messages</span>
              {status.isPending ? (
                <Badge>Checking…</Badge>
              ) : webhook === true ? (
                <Badge variant="success">Receiving</Badge>
              ) : webhook === false ? (
                <Badge variant="danger">Not receiving</Badge>
              ) : (
                <Badge variant="warning">Couldn't check</Badge>
              )}
              <span>Auto-replies</span>
              {channel.chatbot_id ? <Badge variant="success">On</Badge> : <Badge>Off</Badge>}
            </div>

            {!channel.is_active && (
              <Alert variant="warning">Disconnected. Auto-replies and sending are off.</Alert>
            )}
            {status.data?.error && <Alert>{status.data.error}</Alert>}
            {expiry && expiresSoon && (
              <Alert variant="warning">
                The connection expires on {new Date(expiry).toLocaleDateString()}. Reconnect to extend it.
              </Alert>
            )}
            {failure && <Alert>{toApiError(failure).detail}</Alert>}
            {updateToken.isSuccess && <Alert variant="info">Token updated.</Alert>}

            <ProfileData channel={channel} />
            {channel.platform !== "facebook" && <WebhookCheckButton channel={channel} />}

            <form
              className="grid gap-1.5"
              onSubmit={(event) => {
                event.preventDefault();
                updateToken.mutate(token.trim(), { onSuccess: () => setToken("") });
              }}
            >
              <Label htmlFor="new-token">Update access token</Label>
              <div className="flex gap-2">
                <Input
                  id="new-token"
                  type="password"
                  autoComplete="off"
                  required
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                />
                <Button type="submit" variant="outline" disabled={pending}>
                  Update
                </Button>
              </div>
            </form>

            <div className="flex flex-wrap gap-2">
              {channel.is_active ? (
                <Button variant="outline" disabled={pending} onClick={() => disconnect.mutate()}>
                  Disconnect
                </Button>
              ) : null}
              <Button
                variant={channel.is_active ? "outline" : "default"}
                disabled={pending}
                onClick={() => reconnect.mutate()}
              >
                Reconnect
              </Button>
              <Button variant="destructive" disabled={pending} onClick={() => setConfirmRemove(true)}>
                Remove
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
