import { http } from "@/lib/axios";
import type {
  Channel,
  ChannelDetails,
  ChannelStatus,
  FacebookPage,
  Platform,
  SendTextResponse,
  WebhookCheck,
} from "../types";

const base = (platform: Platform) => `/api/channels/${platform}`;
const channelPath = (channel: Channel) =>
  `${base(channel.platform)}/${encodeURIComponent(channel.external_id)}`;

const idField: Record<Platform, string> = {
  facebook: "page_id",
  instagram: "instagram_id",
  whatsapp: "phone_number_id",
};

const connectPath: Record<Platform, string> = {
  facebook: base("facebook"),
  instagram: `${base("instagram")}/connect`,
  whatsapp: `${base("whatsapp")}/connect`,
};

// Each platform truncates at its own length, although the API accepts 4096.
export const MAX_TEXT: Record<Platform, number> = {
  facebook: 2000,
  instagram: 1000,
  whatsapp: 4096,
};

export const channelsApi = {
  list: (platform: Platform) => http.get<Channel[]>(base(platform)).then((r) => r.data),

  // Live calls to Meta. Run them when someone opens a channel, never in a loop.
  status: (channel: Channel) =>
    http.get<ChannelStatus>(`${channelPath(channel)}/status`).then((r) => r.data),
  details: (channel: Channel) =>
    http.get<ChannelDetails>(`${channelPath(channel)}/details`).then((r) => r.data),

  // Instagram and WhatsApp only.
  webhookCheck: (channel: Channel) =>
    http.get<WebhookCheck>(`${channelPath(channel)}/webhook-check`).then((r) => r.data),

  reconnect: (channel: Channel) =>
    http.post<Channel>(`${channelPath(channel)}/reconnect`).then((r) => r.data),
  disconnect: (channel: Channel) => http.delete<Channel>(channelPath(channel)).then((r) => r.data),
  remove: (channel: Channel) => http.delete<void>(`${channelPath(channel)}/remove`),

  updateToken: (channel: Channel, accessToken: string) =>
    http
      .post<Channel>(`${base(channel.platform)}/token`, {
        [idField[channel.platform]]: channel.external_id,
        access_token: accessToken,
      })
      .then((r) => r.data),

  connectWithToken: (platform: Platform, body: Record<string, string>) =>
    http.post<Channel>(connectPath[platform], body).then((r) => r.data),

  // The backend exchanges the code, subscribes the account, registers the number and saves the channel.
  whatsappEmbeddedSignup: (body: {
    code: string;
    waba_id: string;
    phone_number_id: string;
    chatbot_id?: string;
    pin?: string; // the number's existing two-step verification PIN, if the user has one
  }) =>
    http.post<Channel>(`${base("whatsapp")}/embedded-signup`, body).then((r) => r.data),

  facebookOAuthUrl: () =>
    http.get<{ url: string; state: string }>(`${base("facebook")}/oauth/url`).then((r) => r.data),
  facebookCallback: (code: string, state: string) =>
    http
      .post<FacebookPage[]>(`${base("facebook")}/oauth/callback`, { code, state })
      .then((r) => r.data),
  facebookConnectPages: (pageIds: string[], chatbotId?: string) =>
    http
      .post<Channel[]>(`${base("facebook")}/pages/connect`, {
        page_ids: pageIds,
        ...(chatbotId && { chatbot_id: chatbotId }),
      })
      .then((r) => r.data),

  instagramOAuthConfig: () =>
    http.get<{ auth_url: string; state: string }>(`${base("instagram")}/oauth-config`).then((r) => r.data),
  instagramConnect: (code: string, state: string) =>
    http.post<Channel>(`${base("instagram")}/connect`, { code, state }).then((r) => r.data),

  sendText: (channel: Channel, recipient: string, text: string) => {
    const bodies: Record<Platform, object> = {
      facebook: { page_id: channel.external_id, recipient_id: recipient, text },
      instagram: { instagram_id: channel.external_id, recipient_id: recipient, text },
      whatsapp: { phone_number_id: channel.external_id, to: recipient, text },
    };
    return http
      .post<SendTextResponse>(`${base(channel.platform)}/send/text`, bodies[channel.platform])
      .then((r) => r.data);
  },
};
