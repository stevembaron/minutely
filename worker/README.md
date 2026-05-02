# Soon Weather — Pirate Weather proxy

A tiny Cloudflare Worker that proxies Pirate Weather requests so the API
key isn't shipped in the client bundle.

## Why

Pirate Weather requires the key in the URL path. Embedding it in the
SPA's JavaScript means anyone can lift it from the network tab and burn
through the quota. This proxy:

- Holds the key as a Workers secret (server-side)
- Validates lat/lng/timestamp inputs
- Whitelists `units`, `exclude`, `lang` query params
- Optionally restricts which origins may call it (CORS gate)
- Edge-caches successful responses for 5 minutes

## Deploy

You need a (free) Cloudflare account and the wrangler CLI.

```bash
cd worker
npm install
npx wrangler login        # browser auth, one-time
npx wrangler secret put PIRATE_API_KEY
# paste your Pirate Weather key when prompted
npm run deploy
```

`wrangler deploy` will print the public URL (something like
`https://soon-weather-proxy.<your-subdomain>.workers.dev`).

Optionally restrict callers by uncommenting the `[vars]` block in
`wrangler.toml` and setting `ALLOWED_ORIGINS` to a comma-separated list
of your site origins, then re-deploying.

## Use from the client

Set `VITE_API_PROXY_URL` to the worker URL when building the SPA:

```bash
# .env.production at repo root
VITE_API_PROXY_URL=https://soon-weather-proxy.<your-subdomain>.workers.dev
```

The client falls back to direct Pirate Weather calls (with the embedded
key) if `VITE_API_PROXY_URL` is unset, so dev still works without the
proxy deployed.

## Local testing

```bash
npx wrangler dev   # runs locally on http://127.0.0.1:8787
```

Then point your local SPA at it via a `.env.development` file:

```
VITE_API_PROXY_URL=http://127.0.0.1:8787
```
