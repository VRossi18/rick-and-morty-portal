# Local LLM (Ollama + Podman)

Development uses **Ollama** in Podman. Production uses **Groq** on Fly.io — see [fly-deploy.md](fly-deploy.md).

## Prerequisites

- [Podman](https://podman.io/) 4+ with Compose support (`podman compose`)
- Node 24+, pnpm 10 (see root [README](../README.md))

## Quick start

```bash
cp .env.example .env
pnpm install
pnpm run llm:up
pnpm run llm:pull    # first time only — downloads llama3.2:3b
pnpm run dev:all
```

Open `http://localhost:5173`, then try `/character/1` or `/episode/1` and use the **Curiosity** card.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm run llm:up` | Start Ollama container in background |
| `pnpm run llm:down` | Stop Ollama container |
| `pnpm run llm:pull` | Pull default model (`llama3.2:3b`) into the container |

Scripts try `podman compose` first; if the compose provider is missing (common on Windows), they fall back to `podman run` with container name `rick-morty-ollama`.

## Environment (local)

From [`.env.example`](../.env.example):

```env
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=llama3.2:3b
LLM_API_KEY=ollama
VITE_AI_API_URL=/api/ai/character-curiosity
ALLOWED_ORIGINS=http://localhost:5173
```

The BFF proxies through Vite (`/api` → `localhost:8080`). Never put a Groq key in `.env` for local dev unless you intentionally want to test against Groq.

## UI only (no AI)

```bash
pnpm dev
```

Without Ollama and without `pnpm run dev:all`, curiosity panels show the not-configured message if the BFF is not running.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `LLM_NOT_CONFIGURED` / 503 | Ensure `.env` exists; run `dev:all` not just `dev` |
| Connection refused to :11434 | Run `pnpm run llm:up` |
| Model not found | Run `pnpm run llm:pull` |
| Slow first response | Normal on CPU; smaller models help |
| Out of memory | Try a smaller model or close other apps |
| `podman compose` provider missing | Scripts auto-fallback to `podman run`; or install `podman-compose` |

Verify Ollama:

```bash
curl http://localhost:11434/api/tags
```

## Production

Local Ollama is **not** used in production. See [fly-deploy.md](fly-deploy.md) for Fly + Groq setup.
