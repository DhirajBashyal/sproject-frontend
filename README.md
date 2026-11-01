# Social Inbox Frontend

React 19 dashboard for connecting Facebook, Instagram and WhatsApp channels, replying to conversations, and previewing the chat widget.

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
| `VITE_INBOX_USE_MOCK` | `true` shows sample conversations in the inbox |

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

- **Inbox:** the API has no routes for reading conversations, so the inbox uses sample data. Connect real routes in `src/features/inbox/api/inbox.api.ts`.
- **Chatbots:** the API can't list chatbots, so connect forms ask for a chatbot ID.
- **Widget switch:** the API has no on/off route, so the switch on the Integrations page is disabled.
- **OAuth:** Meta redirects to the URI configured on the backend. Don't rename `/social-media-integration/facebook` or `/social-media-integration/instagram`.
- **Rate limit:** the API allows 5 requests per minute per IP, so the app caches data and doesn't poll.

## Reference

See [`docs/social-inbox-frontend-guide.html`](docs/social-inbox-frontend-guide.html).
