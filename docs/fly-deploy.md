# Fly.io deployment (AI BFF)

GitHub Pages serves the static SPA. **Fly.io** hosts the Node/Hono API (`/api/ai/*`, `/health`) with scale-to-zero.

**Local development** uses **Ollama** in Podman — see [`llm-local.md`](llm-local.md). This guide is for **production** (Groq on Fly).

## One-time setup

1. Install [flyctl](https://fly.io/docs/hands-on/install-flyctl/) and sign in: `fly auth login`.

2. Create the app (if it does not exist yet):

```bash
fly apps create rick-morty-portal-api
```

If the name is taken, pick another name and update [`fly.toml`](../fly.toml).

3. Connect the GitHub repo in the [Fly dashboard](https://fly.io/dashboard) (branch `main`, automatic deploy). **Do not** duplicate deploy in GitHub Actions — the pipeline only publishes Pages.

4. Set secrets on Fly (never commit these):

```bash
fly secrets set \
  LLM_API_KEY=gsk_your_groq_key \
  LLM_BASE_URL=https://api.groq.com/openai/v1 \
  LLM_MODEL=llama-3.3-70b-versatile \
  LLM_TOOLS_ENABLED=true \
  LLM_TOOL_MAX_STEPS=5 \
  ALLOWED_ORIGINS=https://vrossi18.github.io
```

`ALLOWED_ORIGINS` is the GitHub Pages origin **without** the repo path (e.g. `https://vrossi18.github.io`, not `/rick-and-morty-portal/`).

5. GitHub repo **Settings → Pages → Source:** GitHub Actions.

6. GitHub **Settings → Secrets → Actions**:

| Secret | Value |
|--------|--------|
| `AI_API_URL` | `https://rick-morty-portal-api.fly.dev/api/ai/character-curiosity` |

Episode curiosities and **RPG chat** derive URLs in the frontend (`character-curiosity` → `episode-curiosity` / `rpg-chat`). No extra GitHub secret is needed for RPG.

7. Remove obsolete secrets: `GCP_*`, `FLY_API_TOKEN` (if deploy is Fly dashboard only), `LLM_API_KEY` on GitHub (Groq key stays on Fly only).

## Manual deploy (optional)

If not using GitHub integration:

```bash
fly deploy --remote-only
curl https://rick-morty-portal-api.fly.dev/health
```

## Production checklist

Run once after setup or when changing app/domain:

1. Fly app name matches [`fly.toml`](../fly.toml) (`rick-morty-portal-api`).
2. Fly secrets set: `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`, `ALLOWED_ORIGINS` (optional: `LLM_TOOLS_ENABLED`, `LLM_TOOL_MAX_STEPS`).
3. `curl https://rick-morty-portal-api.fly.dev/health` → `ok`.
4. GitHub secret `AI_API_URL` points to the Fly BFF character endpoint.
5. Push to `main` → Actions publishes Pages; Fly redeploys API.
6. Open `https://vrossi18.github.io/rick-and-morty-portal/characters`, open a character/episode detail, test **Curiosity**.
7. Test RPG: `/rpg` → create character → **Start game** → `/rpg/play` (GM opening + one player turn).
8. DevTools: POST goes to `*.fly.dev`, no CORS errors.
9. If `503`: check `LLM_API_KEY` on Fly. If CORS: check `ALLOWED_ORIGINS`.
10. Groq key from [console.groq.com](https://console.groq.com); free tier has limits — BFF cache (1h) reduces curiosity calls (RPG chat is not cached).
11. Old GCP resources: [`gcp-teardown.md`](gcp-teardown.md).

## Local API-only mode

```bash
pnpm run llm:up
pnpm run dev:all
```

Or without Ollama: `SERVE_STATIC=false pnpm run server:dev` plus `pnpm dev` in another terminal.

## Cost

[`fly.toml`](../fly.toml) sets `min_machines_running = 0` and `auto_stop_machines = "stop"`. With no traffic, the app scales to zero (free tier allowances apply).
