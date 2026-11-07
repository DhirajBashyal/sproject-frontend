# Social Inbox Frontend

React 19 dashboard for connecting Facebook, Instagram and WhatsApp channels, replying to customer conversations in one inbox, and previewing the chat widget.

## Setup

```bash
npm install
npm run dev
```

The app opens at http://localhost:5173. The API must allow that origin through CORS.

## Environment values

Edit `.env.development` for local work and `.env.production` for builds. Every `VITE_` value ends up in the browser, so never put secrets in these files.

| Name | Purpose |
|---|---|
| `VITE_APP_NAME` | Name shown in the sidebar and sign-in page |
| `VITE_API_BASE_URL` | Backend URL, required |
| `VITE_WIDGET_API_KEY` | Widget access key for the preview |
| `VITE_WIDGET_CHATBOT_ID` | Chatbot UUID for the preview |

Restart the dev server after changing these values.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Typecheck and build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | Typecheck only |
| `npm test` | Run tests |

## Known limits

- **Inbox:** the API has no live updates, so the inbox refreshes the conversation list every 15 seconds while the tab is visible, and once a minute after a rate-limit error.
- **Chatbots:** the API can't list chatbots, so connect forms ask for a chatbot ID.
- **WhatsApp signup:** the "Connect WhatsApp" popup reads its IDs from `GET /api/channels/whatsapp/embedded-signup/config` and sends the result to `POST /api/channels/whatsapp/embedded-signup`. If the backend hasn't set it up, the dialog offers the manual form instead.
- **Comments:** the Inbox's Comments tab lists comments from `GET /api/inbox/comments`, each with one reply (the AI's, or the latest one sent from the dashboard). Channels connected before comment replies existed need to log in with Facebook or Instagram again.
- **Widget switch:** the API has no on/off route, so the switch on the Integrations page is disabled.
- **OAuth:** Meta redirects to the URI configured on the backend (`FACEBOOK_REDIRECT_URI`), currently `https://sproject-frontend.vercel.app/social-media-integration/facebook`. Don't rename `/social-media-integration/facebook` or `/social-media-integration/instagram`.
- **Vercel:** `vercel.json` sends every path to `index.html`, so the OAuth redirect pages load instead of returning 404.
- **Rate limit:** the API allows 5 requests per minute per IP, so the app caches data and doesn't poll.

## Reference

See [`docs/social-inbox-frontend-guide.html`](docs/social-inbox-frontend-guide.html).
