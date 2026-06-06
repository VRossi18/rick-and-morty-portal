# AI curiosities (character & episode detail)

BFF contract for LLM-generated fun facts on **`/character/:id`** and **`/episode/:id`**. The browser never receives the LLM API key.

**Hosting:** static SPA on **GitHub Pages**; BFF on **Fly.io** ([`docs/fly-deploy.md`](fly-deploy.md)).

## LLM profiles

| Profile | LLM | Where configured |
|---------|-----|------------------|
| **Local** | Ollama (Podman) | [`.env.example`](../.env.example), [`docs/llm-local.md`](llm-local.md) |
| **Production** | Groq | Fly secrets — see [`docs/fly-deploy.md`](fly-deploy.md) |

Same BFF code uses the OpenAI-compatible SDK with `LLM_BASE_URL`, `LLM_MODEL`, and a resolved API key (`resolveLlmApiKey` in [`server/src/config.ts`](../server/src/config.ts)). Local Ollama accepts a dummy key (`ollama`) when the base URL is localhost, `127.0.0.1`, or host `ollama`.

## Character endpoint

`POST /api/ai/character-curiosity`

### Request

```json
{
   "characterId": 2,
   "locale": "pt",
   "question": "Por que ele segue o Rick?"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `characterId` | number | yes | Positive integer |
| `locale` | `pt` \| `en` \| `es` | yes | Response language |
| `question` | string | no | Max 400 chars; omit for initial curiosity |

### Response

```json
{
   "text": "Morty Smith é o neto de Rick...",
   "cached": false
}
```

### Server flow (character)

1. Validate request body (zod).
2. Check in-memory cache (`characterId:locale:question`, TTL 1h).
3. Fetch character from `https://rickandmortyapi.com/api/character/{id}`.
4. Build prompts ([`server/src/prompts/characterCuriosity.ts`](../server/src/prompts/characterCuriosity.ts)).
5. Call LLM via OpenAI-compatible API.
6. Return `{ text, cached }`.

---

## Episode endpoint

`POST /api/ai/episode-curiosity`

### Request

```json
{
   "episodeId": 1,
   "locale": "en",
   "question": "Who appears in this episode?"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `episodeId` | number | yes | Positive integer |
| `locale` | `pt` \| `en` \| `es` | yes | Response language |
| `question` | string | no | Max 400 chars; omit for initial curiosity |

### Response

Same shape as character: `{ text, cached }`.

### Server flow (episode)

1. Validate request body (zod).
2. Check in-memory cache (`episode:{episodeId}:locale:question`, TTL 1h).
3. Fetch episode from `https://rickandmortyapi.com/api/episode/{id}`.
4. Optionally resolve up to 20 character names from episode URLs for richer context.
5. Build prompts ([`server/src/prompts/episodeCuriosity.ts`](../server/src/prompts/episodeCuriosity.ts)).
6. Call LLM; return `{ text, cached }`.

---

## Errors (both endpoints)

| Status | Meaning |
|--------|---------|
| `400` | Invalid body |
| `404` | Character or episode not found in Rick and Morty API |
| `429` | LLM rate limit |
| `502` | Upstream/API failure |
| `503` | LLM not configured, invalid key, or quota exceeded |

## Environment variables

### Frontend (GitHub Pages build)

| Variable | Example |
|----------|---------|
| `VITE_AI_API_URL` | `https://rick-morty-portal-api.fly.dev/api/ai/character-curiosity` (via GitHub secret `AI_API_URL`) |
| `VITE_AI_EPISODE_API_URL` | Optional. If unset, derived from `VITE_AI_API_URL` by replacing `character-curiosity` → `episode-curiosity` |

Local dev: `/api/ai/character-curiosity` (Vite proxy → localhost:8080).

### Server — local (`.env`)

| Variable | Example |
|----------|---------|
| `LLM_BASE_URL` | `http://localhost:11434/v1` |
| `LLM_MODEL` | `llama3.2:3b` |
| `LLM_API_KEY` | `ollama` (or omit — auto for local endpoint) |
| `ALLOWED_ORIGINS` | `http://localhost:5173` |

### Server — production (Fly secrets)

| Variable | Example |
|----------|---------|
| `LLM_API_KEY` | `gsk_...` (Groq) |
| `LLM_BASE_URL` | `https://api.groq.com/openai/v1` |
| `LLM_MODEL` | `llama-3.3-70b-versatile` |
| `ALLOWED_ORIGINS` | `https://vrossi18.github.io` (exact origin, no path) |
| `SERVE_STATIC` | `false` on Fly |
| `PORT` | `8080` |

## GitHub Actions secrets

| Secret | Purpose |
|--------|---------|
| `AI_API_URL` | Baked into Pages build as `VITE_AI_API_URL` |

Groq key and CORS origins live on **Fly secrets**, not in the static bundle. Fly deploy is via **GitHub integration** (not Actions). See [`docs/fly-deploy.md`](fly-deploy.md).

## Local development

1. Copy [`.env.example`](../.env.example) to `.env`.
2. Start Ollama: `pnpm run llm:up` then `pnpm run llm:pull` (first time).
3. Run `pnpm run dev:all` (API on **8080**, Vite on **5173**, proxy `/api` → server).

See [`docs/llm-local.md`](llm-local.md). UI-only without AI: `pnpm dev`.

## Troubleshooting

| Symptom | Check |
|---------|-------|
| `503` AI service is not configured | Local: Ollama + `dev:all` + `.env`. Prod: `LLM_API_KEY` on Fly |
| CORS error on Pages | `ALLOWED_ORIGINS=https://vrossi18.github.io` on Fly |
| `503` AI service misconfigured | Invalid or revoked Groq key (prod) |
| `429` Rate limit exceeded | Groq free-tier limits; wait and retry |
| `502` on local dev | Server not running on 8080 (`curl http://localhost:8080/health`) |
| Ollama connection refused | `pnpm run llm:up` |
| 404 to `/gsk_...` in browser | `VITE_AI_API_URL` must be the BFF path, not the API key |
| Cold start delay | Fly scale-to-zero; first request after idle may take a few seconds |

## Frontend integration

### Character

- [`CharacterCuriosityPanel`](../src/components/characters/CharacterCuriosityPanel.tsx)
- [`useCharacterCuriosity`](../src/hooks/useCharacterCuriosity.ts)

### Episode

- [`EpisodeCuriosityPanel`](../src/components/episodes/EpisodeCuriosityPanel.tsx)
- [`useEpisodeCuriosity`](../src/hooks/useEpisodeCuriosity.ts)

### Shared

- [`src/config/ai.ts`](../src/config/ai.ts) — API URL resolution

## Out of scope (v1)

- Curiosities on the episodes list (`/episodes`)
- Streaming responses
- Persistent chat history
- Redis / distributed cache
