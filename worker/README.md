# AI Proxy Worker

A Cloudflare Worker that stands between the app and OpenAI.

## Why this exists

`EXPO_PUBLIC_*` environment variables are inlined into the JavaScript bundle at
build time. An OpenAI key held by the app is readable by anyone who downloads the
app and unzips the IPA. The key lives here instead, as a Worker secret, and the
app never sees it.

An open proxy is just as bad as a leaked key — anyone who finds the URL can spend
your OpenAI credits. So every request must carry a valid Firebase ID token, which
the Worker verifies (RS256, against Google's published JWKS) before forwarding.

AI is a premium feature, and the app's paywall is only a UI check — someone who
pulls the Worker URL out of the bundle can call it directly. So the Worker
re-checks the subscription itself, against RevenueCat, using the Firebase uid as
the `app_user_id`.

## Guards

| Guard           | Behaviour                                                                     |
| --------------- | ----------------------------------------------------------------------------- |
| Auth            | Firebase ID token required; signature, `iss`, `aud`, `exp`, `iat` all checked |
| Entitlement     | Active `It's Adventure Time Pro` in RevenueCat; fails closed                  |
| Model           | Allowlist — only `gpt-4o-mini`                                                |
| Completion size | `max_tokens` clamped to 1200                                                  |
| Request size    | 8 MB (base64 images are large)                                                |
| Errors          | OpenAI error bodies are logged, never returned to the client                  |

## Deploy

```bash
cd worker
npm install
npx wrangler login
```

Set the Firebase project ID in `wrangler.toml` — the same value as
`EXPO_PUBLIC_FIREBASE_PROJECT_ID` in the app's `.env`. This is what the Worker
checks each token's `aud` against, so it must match exactly.

Set `REVENUECAT_ENTITLEMENT_ID` in `wrangler.toml` to the **internal id** of the
`It's Adventure Time Pro` entitlement — RevenueCat → Entitlements → open it; the
id looks like `entl498b7a7b44` and appears in the page URL. The lookup key will
not work: `active_entitlements` only ever reports internal ids.

Then set both secrets (never put these in `wrangler.toml`, which is committed):

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put REVENUECAT_API_KEY
npx wrangler deploy
```

`REVENUECAT_API_KEY` is a **V2 secret** API key from RevenueCat → Project
Settings → API keys, scoped to customer read only. It is not the public SDK key
the app ships with.

The app also relies on Firebase **Anonymous** sign-in, so signed-out users still
have an identity the Worker can verify. Enable it in Firebase Console →
Authentication → Sign-in method → Anonymous. Anonymous users have no entitlement,
so they get a 403 from the Worker and the paywall in the app.

Deploy prints a URL like `https://adventure-time-ai-proxy.<subdomain>.workers.dev`.
Put it in the app's `.env`:

```
EXPO_PUBLIC_AI_PROXY_URL=https://adventure-time-ai-proxy.<subdomain>.workers.dev
```

This URL is safe to ship in the bundle — it is useless without a signed-in user.

## Rotating the OpenAI key

Order matters. Rotate **after** the proxy is live and the app is building against
it, otherwise the replacement key gets inlined into the next bundle and leaks the
same way the first one did.

1. Deploy this Worker with the current key.
2. Ship an app build that talks to the Worker.
3. Create a new key at <https://platform.openai.com/api-keys>.
4. `npx wrangler secret put OPENAI_API_KEY` with the new value.
5. Revoke the old key.

## Not yet handled

There is no per-user rate limit. Model and token caps bound the cost of any single
request, but a signed-in user can still issue many. Adding one needs KV or a
Durable Object.
