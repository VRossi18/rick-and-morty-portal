# Local LLM (Ollama + Docker or Podman)

Development uses **Ollama** in a container (Docker or Podman). Production uses **Groq** on Fly.io — see [fly-deploy.md](fly-deploy.md).

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) **or** [Podman](https://podman.io/) 4+ with Compose support (`docker compose` / `podman compose`)
- Node 24+, pnpm 10 (see root [README](../README.md))
- ~8 GB RAM recommended for the default model (`llama3.1:8b`)

## Quick start

```bash
cp .env.example .env
pnpm install
pnpm run llm:up
pnpm run llm:pull    # first time only — downloads llama3.1:8b
pnpm run dev:all
```

Open `http://localhost:5173`, then try `/character/1` or `/episode/1` and use the **Curiosity** card, or play the RPG at `/rpg` → **Start game** → `/rpg/play`.

`pnpm run llm:up` logs the chosen runtime, for example `Using container runtime: docker (auto)`.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm run llm:up` | Start Ollama container in background |
| `pnpm run llm:down` | Stop Ollama container |
| `pnpm run llm:pull` | Pull default model (`llama3.1:8b`) into the container |

Scripts try `compose up` first; if the compose provider is missing (common on Windows), they fall back to `docker run` / `podman run` with container name `rick-morty-ollama`.

## Container runtime (`LLM_RUNTIME`)

Set in `.env` or the shell before `pnpm run llm:*`:

| Value | Behavior |
|-------|----------|
| `auto` (default) | Detect Docker/Podman; prefer an existing `rick-morty-ollama` container; if both are installed, prefer Podman |
| `docker` | Force Docker |
| `podman` | Force Podman |

```env
LLM_RUNTIME=docker
```

## Environment (local)

From [`.env.example`](../.env.example):

```env
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=llama3.1:8b
LLM_API_KEY=ollama
LLM_TOOLS_ENABLED=true
LLM_TOOL_MAX_STEPS=5
# LLM_RUNTIME=auto
VITE_AI_API_URL=/api/ai/character-curiosity
ALLOWED_ORIGINS=http://localhost:5173
```

The BFF proxies through Vite (`/api` → `localhost:8080`). Never put a Groq key in `.env` for local dev unless you intentionally want to test against Groq.

`VITE_AI_API_URL` also enables the RPG GM chat: the frontend derives `/api/ai/rpg-chat` from the character-curiosity path.

Set `LLM_TOOLS_ENABLED=false` to disable RPG function calling (single completion, no dice/API lookups).

## RPG chat (local)

1. Same `.env` and `pnpm run dev:all` as curiosities.
2. Open `/rpg`, create a character, click **Start game**.
3. On `/rpg/play`, the GM opening scene loads automatically; send a message to continue the session.

With tools enabled, the GM can roll dice and look up canon via the Rick and Morty API (transparent to the UI).

Smoke test (BFF must be running on `:8080`):

```bash
curl -s -X POST http://localhost:8080/api/ai/rpg-chat \
  -H "Content-Type: application/json" \
  -d "{\"locale\":\"pt\",\"characterSheet\":{\"meta\":{\"schemaVersion\":3},\"character\":{\"name\":\"Morty\"}},\"messages\":[],\"opening\":true}"
```

Expect `{ "text": "..." }`. Through Vite proxy, use `http://localhost:5173/api/ai/rpg-chat` instead.

## UI only (no AI)

```bash
pnpm dev
```

Without Ollama and without `pnpm run dev:all`, curiosity panels and RPG chat show the not-configured message if the BFF is not running.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `LLM_NOT_CONFIGURED` / 503 | Ensure `.env` exists; run `dev:all` not just `dev` |
| Connection refused to :11434 | Run `pnpm run llm:up` |
| Model not found | Run `pnpm run llm:pull` |
| Slow first response | Normal on CPU; 8b model needs more RAM; RPG sends full character sheet JSON |
| RPG opening never loads | Use `dev:all`, not `dev` alone; check BFF on `:8080` |
| Out of memory | Close other apps or set `LLM_TOOLS_ENABLED=false` and try a smaller model |
| Wrong runtime picked (both installed) | Set `LLM_RUNTIME=docker` or `LLM_RUNTIME=podman` in `.env` |
| `compose` provider missing | Scripts auto-fallback to `run`; or install Docker Desktop / `podman-compose` |
| No container runtime found | Install Docker or Podman; see error message from `pnpm run llm:up` |

Verify Ollama:

```bash
curl http://localhost:11434/api/tags
```

## Manual verification checklist

```bash
# Docker
LLM_RUNTIME=docker pnpm run llm:up
LLM_RUNTIME=docker pnpm run llm:pull

# Podman
LLM_RUNTIME=podman pnpm run llm:up
pnpm run llm:pull

# Auto (reads .env or detects installed runtime)
pnpm run llm:up
```

## Production

Local Ollama is **not** used in production. See [fly-deploy.md](fly-deploy.md) for Fly + Groq setup.
