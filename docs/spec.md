# AI curiosities (character & episode detail)

BFF contract for LLM-generated fun facts on **`/character/:id`** and **`/episode/:id`**. The browser never receives the LLM API key.

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
5. Call Groq via OpenAI-compatible API (`LLM_BASE_URL`, default `llama-3.3-70b-versatile`).
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
6. Call Groq; return `{ text, cached }`.

---

## Errors (both endpoints)

| Status | Meaning |
|--------|---------|
| `400` | Invalid body |
| `404` | Character or episode not found in Rick and Morty API |
| `429` | Groq rate limit |
| `502` | Upstream/API failure |
| `503` | `LLM_API_KEY` missing, invalid key, or quota exceeded |

## Environment variables

### Frontend

| Variable | Example |
|----------|---------|
| `VITE_AI_API_URL` | `/api/ai/character-curiosity` (Cloud Run) or absolute Cloud Run URL (GitHub Pages) |
| `VITE_AI_EPISODE_API_URL` | Optional. If unset, derived from `VITE_AI_API_URL` by replacing `character-curiosity` → `episode-curiosity` |

### Server

| Variable | Example |
|----------|---------|
| `LLM_API_KEY` | `gsk_...` (Groq) |
| `LLM_BASE_URL` | `https://api.groq.com/openai/v1` |
| `LLM_MODEL` | `llama-3.3-70b-versatile` |
| `ALLOWED_ORIGINS` | `https://xxx.run.app,https://user.github.io` |
| `PORT` | `8080` |

## GitHub Actions secrets

- `LLM_API_KEY` — Groq API key
- `ALLOWED_ORIGINS`
- `AI_API_URL` — absolute URL for GitHub Pages build (`https://<cloud-run>/api/ai/character-curiosity`). Episode URL is derived at build time unless you set `VITE_AI_EPISODE_API_URL` in the workflow.

## Local development

Copy [`.env.example`](../.env.example) to `.env` at the repo root, set `LLM_API_KEY`, then:

```bash
pnpm run dev:all
```

This starts the API on port **8080** and Vite on **5173** (proxy `/api` → server). Alternatively, two terminals: `pnpm run server:dev` and `pnpm dev`.

## Troubleshooting

| Symptom | Check |
|---------|-------|
| `503` AI service is not configured | `LLM_API_KEY` set in root `.env`; restart `pnpm run dev:all` |
| `503` AI service misconfigured | Invalid or revoked Groq key |
| `429` Rate limit exceeded | Groq free-tier limits; wait and retry |
| `502` on local dev | Server not running on 8080 (`curl http://localhost:8080/health`) |
| 404 to `/gsk_...` in browser | `VITE_AI_API_URL` must be the BFF path, not the API key |

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
