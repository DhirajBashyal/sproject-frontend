import { useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toApiError } from "@/lib/axios";
import { ChannelDetailsDialog } from "../components/ChannelDetailsDialog";
import { ConnectWithTokenDialog } from "../components/ConnectWithTokenDialog";
import { autoReplyLabel, PLATFORM_LABEL, PlatformIcon } from "../components/PlatformIcon";
import { WhatsAppConnectDialog } from "../components/WhatsAppConnectDialog";
import { useChannels, useStartOAuth } from "../hooks/useChannels";
import { isPlatform, type Channel, type Platform } from "../types";

function subtitle(channel: Channel) {
  const label =
    channel.config.category ?? channel.config.account_type ?? channel.config.display_phone_number;
  const replies = autoReplyLabel(channel.platform, channel.chatbot_id);
  return label ? `${label} · ${replies}` : replies;
}

function ChannelList({ platform }: { platform: Platform }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const channels = useChannels(platform);
  const startOAuth = useStartOAuth();
  const label = PLATFORM_LABEL[platform];
  const tokenDialogOpen = searchParams.get("connect") === "1";
  const selected = channels.data?.find((channel) => channel.external_id === selectedId);

  const setTokenDialogOpen = (open: boolean) => setSearchParams(open ? { connect: "1" } : {}, { replace: true });

  return (
    <div className="mx-auto grid max-w-4xl gap-5 p-6">
      <title>{label}</title>
      <p className="text-sm text-muted-foreground">
        <Link to="/channels" className="underline">
          All Channels
        </Link>{" "}
        / {label}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <PlatformIcon platform={platform} className="size-9 rounded-md" />
          {label}
        </h1>
        <div className="flex flex-wrap gap-2">
          {platform === "whatsapp" ? (
            <>
              <Button variant="outline" onClick={() => setTokenDialogOpen(true)}>
                Enter details manually
              </Button>
              <Button onClick={() => setWhatsAppOpen(true)}>Connect WhatsApp</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setTokenDialogOpen(true)}>
                Use an access token
              </Button>
              <Button disabled={startOAuth.isPending} onClick={() => startOAuth.mutate(platform)}>
                Connect with {platform === "facebook" ? "Facebook" : "Instagram"}
              </Button>
            </>
          )}
        </div>
      </div>

      {startOAuth.error && <Alert>{toApiError(startOAuth.error).detail}</Alert>}
      {channels.error && <Alert>{toApiError(channels.error).detail}</Alert>}
      {channels.isPending && <p className="text-sm text-muted-foreground">Loading channels…</p>}

      {channels.data?.length === 0 && (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <b>No {label} channels connected</b>
          <p className="mt-1 text-sm text-muted-foreground">Connect one to reply to its messages here.</p>
        </div>
      )}

      {channels.data && channels.data.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {channels.data.map((channel) => (
            <li key={channel.id} className="flex flex-wrap items-center gap-3 p-4">
              <span className="grid size-9 place-items-center rounded-full bg-primary-soft font-semibold text-primary">
                {channel.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-40 flex-1">
                <b className="text-sm break-words">{channel.name}</b>
                <p className="text-xs text-muted-foreground">{subtitle(channel)}</p>
              </div>
              {channel.is_active ? (
                <Badge variant="success">
                  <span className="size-1.5 rounded-full bg-success" /> Active
                </Badge>
              ) : (
                <Badge variant="warning">Disconnected</Badge>
              )}
              <Button variant="outline" size="sm" onClick={() => setSelectedId(channel.external_id)}>
                Manage
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ConnectWithTokenDialog platform={platform} open={tokenDialogOpen} onOpenChange={setTokenDialogOpen} />
      {platform === "whatsapp" && (
        <WhatsAppConnectDialog
          open={whatsAppOpen}
          onOpenChange={setWhatsAppOpen}
          onManual={() => {
            setWhatsAppOpen(false);
            setTokenDialogOpen(true);
          }}
        />
      )}
      {selected && <ChannelDetailsDialog channel={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

export function PlatformChannelsPage() {
  const { platform } = useParams();
  if (!isPlatform(platform)) return <Navigate to="/channels" replace />;
  return <ChannelList key={platform} platform={platform} />;
}
