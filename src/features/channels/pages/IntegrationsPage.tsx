import { FileText, MessageCircleMore } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { env } from "@/config/env";
import { toApiError } from "@/lib/axios";
import { PlatformIcon } from "../components/PlatformIcon";
import { useAllChannels, useStartOAuth } from "../hooks/useChannels";
import type { Platform } from "../types";

const cards: { platform: Platform; title: string; text: string; docs: string }[] = [
  {
    platform: "instagram",
    title: "Instagram",
    text: "Connect your agent to an Instagram page and respond to messages.",
    docs: "https://developers.facebook.com/docs/instagram-platform",
  },
  {
    platform: "facebook",
    title: "Messenger",
    text: "Connect your agent to a Facebook page and respond to messages.",
    docs: "https://developers.facebook.com/docs/messenger-platform",
  },
  {
    platform: "whatsapp",
    title: "WhatsApp",
    text: "Connect your agent to a WhatsApp number and respond to messages.",
    docs: "https://developers.facebook.com/docs/whatsapp/cloud-api",
  },
];

interface CardShellProps {
  icon: ReactNode;
  corner?: ReactNode;
  title: string;
  text: string;
  docs: ReactNode;
  action: ReactNode;
}

function CardShell({ icon, corner, title, text, docs, action }: CardShellProps) {
  return (
    <article className="flex min-w-0 flex-col rounded-lg border bg-muted p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        {icon}
        {corner}
      </div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="mb-5 flex-1 text-sm text-muted-foreground">{text}</p>
      <div className="grid grid-cols-[1fr_1.4fr] gap-2">
        {docs}
        {action}
      </div>
    </article>
  );
}

export function IntegrationsPage() {
  const navigate = useNavigate();
  const { lists, isPending, error } = useAllChannels();
  const startOAuth = useStartOAuth();
  const widgetConfigured = Boolean(env.widgetApiKey && env.widgetChatbotId);

  function setup(platform: Platform) {
    if (platform === "whatsapp") void navigate("/channels/whatsapp?connect=1");
    else startOAuth.mutate(platform);
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <title>Social Media Integrations</title>
      <h1 className="text-2xl font-bold">Social Media Integrations</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage your channels here.</p>
      <h2 className="mt-7 mb-4 text-lg font-semibold">All Channels</h2>

      <div className="grid gap-3">
        {error && <Alert>{toApiError(error).detail}</Alert>}
        {startOAuth.error && <Alert>{toApiError(startOAuth.error).detail}</Alert>}
      </div>

      <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-4">
        <CardShell
          icon={
            <span className="grid size-12 place-items-center rounded-lg bg-background text-primary">
              <MessageCircleMore className="size-7" />
            </span>
          }
          corner={
            <Switch
              checked={widgetConfigured}
              disabled
              aria-label="Chat widget on or off"
              title="The backend needs a route for this switch."
            />
          }
          title="Chat Widget"
          text="Add a floating chat window to your website."
          docs={
            <Button variant="outline" asChild>
              <Link to="/channels/widget">
                <FileText /> Docs
              </Link>
            </Button>
          }
          action={
            <Button asChild>
              <Link to="/channels/widget">Manage</Link>
            </Button>
          }
        />

        {cards.map(({ platform, title, text, docs }) => {
          const channels = lists[platform];
          const active = channels?.some((channel) => channel.is_active);
          return (
            <CardShell
              key={platform}
              icon={<PlatformIcon platform={platform} className="size-12 rounded-lg" />}
              corner={
                active && (
                  <Badge variant="success">
                    <span className="size-1.5 rounded-full bg-success" /> Active
                  </Badge>
                )
              }
              title={title}
              text={text}
              docs={
                <Button variant="outline" asChild>
                  <a href={docs} target="_blank" rel="noreferrer">
                    <FileText /> Docs
                  </a>
                </Button>
              }
              action={
                channels?.length ? (
                  <Button asChild>
                    <Link to={`/channels/${platform}`}>Manage</Link>
                  </Button>
                ) : (
                  <Button disabled={isPending || startOAuth.isPending} onClick={() => setup(platform)}>
                    Setup
                  </Button>
                )
              }
            />
          );
        })}
      </div>
    </div>
  );
}
