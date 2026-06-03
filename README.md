<p align="center">
  <img src="public/favicon.png" alt="Rick and Morty Portal" width="128" height="128" />
</p>

<h1 align="center">Rick and Morty Portal</h1>

<p align="center">
  <a href="https://github.com/VRossi18/rick-morty-portal/actions/workflows/pipeline.yml">
    <img src="https://github.com/VRossi18/rick-morty-portal/actions/workflows/pipeline.yml/badge.svg" alt="Pipeline status" />
    <img src="https://github.com/VRossi18/rick-and-morty-portal/actions/workflows/react-doctor.yml/badge.svg" alt="React doctor status">
  </a>
</p>

A small **React** app that browses characters from the [Rick and Morty API](https://rickandmortyapi.com/), with a **character detail** view, client-side routing, and a portal-style transition between the grid and the detail screen. This repository doubles as a **hands-on sandbox for learning GitHub Actions**: workflows, jobs, automated deploys, and keeping `main` green with lint, tests, and security audit. Production is published to **GitHub Pages** and **Google Cloud Run** on every push to `main`. It is also a place to **go deeper with the stack** (React, TypeScript, Vite, routing, i18n, testing) and to **experiment with LLM-backed gameplay**—for example a GM or rules assistant grounded in the rules you encode in the app.

---

## Why this project exists

The **primary goal** is to get comfortable with **GitHub Actions** in a real (but small) codebase: defining when workflows run, wiring Node and pnpm, splitting work across jobs, publishing to **GitHub Pages** and **Google Cloud**, and failing fast when lint or tests break. The UI is the fun part; the pipeline is the lesson.

Beyond CI/CD, the project is meant to grow a **playable Rick and Morty–inspired RPG loop** where a **large language model** can help run a session (narration, rolls, or structured prompts tied to the character sheet). The current **`/rpg`** route includes point-buy creation, racial modifiers and drawbacks, a **cheat-sheet** of derived values (HP, physical/magical attack channels, social pool, DEX speed tiers, **stealth** with a small racial knack for Bird-Person and Parasites), per-race **skill sets** (two attacks, support, item with out-of-combat use), and **JSON export** (`schemaVersion` **3** in [`buildCharacterSheetExport`](src/components/rpg/buildCharacterSheetExport.ts)). It now also includes three one-click base presets (**Rick OP**, **Morty**, **Evil Morty**) that auto-fill name/race/scores, all modeled as **humans** with distinct preset portraits. The UI also offers **Create character**: confirm in a dialog, then a **summary sheet** with the full build, export from there, and a placeholder **Start game** control. Full 27-point spend and a character name are required before export or creation. The pipeline publishes a **sample JSON artifact** so the schema stays documented in CI. Successful **production deploys on `main`** bump an automatic **SemVer-style patch tag** (`v1.0.1`, `v1.0.2`, …) using [`.github/version-prefix`](.github/version-prefix). Future work can add session UI, an API/MCP surface, or richer prompts while keeping the static GitHub Pages story where possible.

### What the pipeline does

| Job                     | When                                                   | Steps                                                                                                              |
| ----------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Lint and test**       | Every push and PR to `main`                            | `pnpm install` → `pnpm lint` → `pnpm test` → `server` tests → `pnpm run rpg:write-export-sample` → upload artifact |
| **Build and audit**     | After lint and test succeed                            | `pnpm install` → `pnpm run build` (Pages: `VITE_AI_API_URL` from secrets) → `pnpm audit` → upload `dist`           |
| **Deploy Cloud Run**    | After build, only on **`push` to `main`**              | Docker image (Node serves SPA + AI API) → GHCR → Artifact Registry → Cloud Run; smoke tests on `/health` and `/`   |
| **Deploy GitHub Pages** | After build, only on **`push` to `main`**              | `actions/deploy-pages` publishes the uploaded artifact                                                             |
| **Tag release (patch)** | After **both** deploys succeed on **`push` to `main`** | Reads [`.github/version-prefix`](.github/version-prefix), bumps patch tag (`v1.0.1`, …), pushes to origin          |

The production build runs [`scripts/copy-404.mjs`](scripts/copy-404.mjs) after Vite so **`dist/404.html`** mirrors `index.html`. That helps the hosted SPA when users refresh or open a deep link. Unknown in-app routes are handled by a dedicated **404 page** (React Router catch-all `path="*"`), so client navigation to a missing path shows the themed UI instead of a blank outlet.

### Hosting (production)

| Target               | What runs                                                                                 | Notes                                                           |
| -------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **GitHub Pages**     | Static `dist` from the main Vite build (`base`: `/rick-and-morty-portal/`)                | Project-site URL under the repo name                            |
| **Google Cloud Run** | Node container ([`Dockerfile`](Dockerfile)) on port **8080**: static `dist` + `/api/ai/*` | Build uses `VITE_BASE=/`; Groq (`LLM_*`) secrets on the service |

Cloud Run requires GitHub Actions secrets: `GCP_*` (see table above), plus `LLM_API_KEY`, `ALLOWED_ORIGINS`, and for GitHub Pages `AI_API_URL`. See [`docs/spec.md`](docs/spec.md).

```mermaid
flowchart LR
   subgraph trigger [Triggers]
      push[push to main]
      pr[pull request to main]
   end
   subgraph job1 [lint-and-test]
      install1[pnpm install]
      lint[pnpm lint]
      test[pnpm test]
      rpgSample[rpg write-export-sample]
      artifact[upload-artifact sample JSON]
      install1 --> lint --> test --> rpgSample --> artifact
   end
   subgraph job2 [build-and-audit]
      install2[pnpm install]
      build[pnpm run build]
      audit[pnpm audit]
      upload[upload-pages-artifact]
      install2 --> build --> audit --> upload
   end
   subgraph job3 [deploy-cloud-run]
      docker[docker build and push]
      cloudRun[deploy Cloud Run]
      docker --> cloudRun
   end
   subgraph job4 [deploy-pages]
      deploy[deploy-pages]
   end
   subgraph job5 [tag-deploy]
      tagBump[bump patch tag and push]
   end
   push --> job1
   pr --> job1
   job1 -->|needs success| job2
   job2 -->|main push only| job3
   job2 -->|main push only| job4
   job3 -->|both succeed| job5
   job4 -->|both succeed| job5
```

Workflow file: [`.github/workflows/pipeline.yml`](.github/workflows/pipeline.yml). In the repo **Settings → Pages**, the source should be **GitHub Actions** so the Pages deploy job can run. Configure the GCP secrets above for Cloud Run. The **tag-deploy** job sets **`contents: write`** only on that job so it can push tags; the rest of the workflow keeps the default `contents: read` where applicable.

---

## Tech stack

- **Runtime / tooling:** Node.js **24+**, **pnpm 10** (see `engines` in [`package.json`](package.json))
- **Hosting:** GitHub Pages + **Google Cloud Run** (Docker / Artifact Registry / Workload Identity Federation in CI)
- **UI:** React 19, TypeScript, Vite 8
- **Routing / motion:** React Router 7, Framer Motion (shared `layoutId` on the character image, `AnimatePresence` between routes)
- **Styling:** Tailwind CSS 4, FlyonUI, `clsx` / `tailwind-merge`
- **Data:** Axios (`GET /character`, `GET /episode`, and `GET /location` for lists, detail routes for each — see [`CharacterService`](src/services/characters.ts), [`EpisodeService`](src/services/episodes.ts), and [`LocationService`](src/services/locations.ts))
- **i18n:** `i18next` + `react-i18next`, copy in [`src/locales/pt/common.json`](src/locales/pt/common.json) / [`src/locales/en/common.json`](src/locales/en/common.json), bootstrap in [`src/i18n.ts`](src/i18n.ts)
- **Quality:** ESLint (flat config), Vitest, Testing Library, jsdom; **tsx** (dev) to run [`scripts/write-rpg-character-export-sample.ts`](scripts/write-rpg-character-export-sample.ts) for the CI JSON fixture
- **Learning / experiments:** More real-world practice with the stack above; upcoming **LLM integration** (hosted APIs, structured prompts, or MCP) to support a **playable** tabletop-style loop alongside the UI

### Performance and React best practices

The UI is kept **as lean as practical** for a Vite SPA: routes are **lazy-loaded** with code splitting (each page is its own chunk), list cards and filter handlers avoid unnecessary re-renders where it matters, and updates from search or API responses use **React transitions** so typing stays responsive. The production bundle favors a small initial entry and loads heavier views (for example **`/rpg`**) only when visited.

Front-end choices follow **[Vercel React Best Practices](https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices)** (bundle size, re-render optimization, rendering performance) as applied to this stack—not Next.js/RSC rules, but the same performance mindset for client-side React.

---

## Current features

- Paginated grid of characters from the public API
- **Filters** — search by name (debounced), status, gender, species, and type (selects backed by the API catalog); wired to [`CharacterService.getCharacters`](src/services/characters.ts)
- **Click a card** (`cursor: pointer`) to open **`/character/:id`**, with a short “portal” feel: other cards dim / ease aside, the image **animates into** the detail layout, and an optional radial overlay uses the click origin when navigation passes `location.state`
- **Character detail** page: full fields from the API (status, species, type, gender, origin, location, episode count, created), loading and error handling (including 404); **origin** and **current location** link to **`/location/:id`** when the API provides a location URL
- **Episodes** at **`/episodes`** — **season filter** (1–5) with **pagination scoped to the selected season** (API `episode=Sxx` when browsing by season; character multiselect still uses a client-side pass over the catalog). **Responsive grid** (episodes flow left-to-right by episode code, same palette, glow cards, Framer Motion transitions as the character grid), search by episode name, and **multi-select character filter** (AND logic — episode must include every selected character). **`/episode/:id`** shows air date, code, created timestamp, and linked characters with thumbnails.
- **Locations** at **`/locations`** — paginated grid with **filters** by name (debounced), **type**, and **dimension** (API-backed selects). **`/location/:id`** shows type, dimension, resident count, **residents** linked to **`/character/:id`**, and **related episodes** derived from resident appearances (the API has no direct location→episode link; the UI explains this). Same glow cards and portal-style navigation as episodes.
- **Character detail** at **`/character/:id`** — portrait, metadata, episode links, and an **AI curiosity card** below the image (OpenAI via BFF, initial fun fact + follow-up questions). See [`CharacterCuriosityPanel`](src/components/characters/CharacterCuriosityPanel.tsx) and [`docs/spec.md`](docs/spec.md)
- Loading and error states on the list
- **About me** page at **`/about`** (author bio, portrait, contact / social links)
- **Donations modal** — navbar **Support / Apoiar** opens a dialog with an educational disclaimer (donations optional), **Crypto** tab on **Polygon** via **wagmi** + contract `donate()` payable, and a **PIX / Stripe** tab placeholder for future fiat flows. See [`DonationModal`](src/components/donations/DonationModal.tsx) and [`docs/donations-contract.md`](docs/donations-contract.md)
- **Internationalization (PT / EN / ES)** — UI strings live in locale JSON (`src/locales/{pt,en,es}/common.json`); language is stored in **`localStorage`** (`portal.locale`, default `pt`); **`document.documentElement.lang`** stays in sync; **navbar flag switcher** (Brazil, US, Spain) ([`LanguageSwitcher`](src/components/layout/LanguageSwitcher.tsx))
- Light / dark theme toggle
- Responsive layout
- **Rick and Morty RPG** — point-buy **character creator** at **`/rpg`**: races with modifiers and drawbacks, 27-point pool, scores 8–15 before racial, live totals, per-race **skills** (attacks / support / item), and selected-race skill descriptions (**name + summary**). Includes three one-click base presets (**Rick OP**, **Morty**, **Evil Morty**) to speed up setup; all presets use the **human** race and distinct preset portraits (Rick/Morty/Evil Morty). Also includes **derived stats** (HP, attack channels, social pool, DEX cadence, **stealth** with +2 racial ease for Bird-Person and Parasites), a **cheat-sheet** on the page, **Export JSON** (confirm dialog), and **Create character** (second confirm, then a **summary modal** with the full sheet, export from there, and a non-functional **Start game** button for upcoming flow). See [`CharacterSheetContainer`](src/components/rpg/CharacterSheetContainer.tsx), [`useCharacterCreation`](src/components/rpg/useCharacterCreation.ts), [`presets`](src/components/rpg/presets.ts), [`rpgDerivedSheet`](src/components/rpg/rpgDerivedSheet.ts), and [`buildCharacterSheetExport`](src/components/rpg/buildCharacterSheetExport.ts).
- **Custom 404 page** — any unknown route (e.g. `/dimensao-perdida`) renders [`NotFoundPage`](src/pages/NotFoundPage.tsx) inside the main shell (navbar + theme toggle stay visible). Visual design is inspired by [this CodePen](https://codepen.io/hkmtqffr/pen/dVPewm): spinning starfield, large **“44”** with a Rick and Morty portal image in the middle, localized message (PT / EN / ES), and a home link back to **`/characters`** (e.g. **“GET ME HOME”**, **“ME LEVA PARA CASA”**, **“Llévame a casa”**). Styles live in [`src/styles/not-found.css`](src/styles/not-found.css); the portal asset is served from [`public/404/portal.png`](public/404/portal.png) via `import.meta.env.BASE_URL`. Animations respect `prefers-reduced-motion`.
- **`import.meta.env.BASE_URL`** as the router `basename` — GitHub Pages subpath in the default build; root path when building for Cloud Run (see [`vite.config.ts`](vite.config.ts))

---

## Roadmap

1. **LLM-playable tabletop RPG** — evolve **`/rpg`** into a session you can run with an LLM (session UI, richer prompts, optional small backend or MCP) while keeping the static app and GitHub Pages story in mind; JSON export is already the first integration surface for external tools

2. **Detail page polish (characters & episodes)** — deepen **`/character/:id`** and **`/episode/:id`** beyond the current API fields: cross-links (e.g. from a character to episodes they appear in, from an episode back to filtered lists), optional portal-style transitions on episode detail similar to characters, and small UX tweaks (skeletons, retry, shared layout blocks) so both detail screens feel like one product surface

3. **AI curiosities (episodes)** — extend the BFF pattern from character detail to **`/episode/:id`** (character curiosities are live; see [`docs/spec.md`](docs/spec.md))

4. **Donations (Stripe / PIX)** — wire the existing modal fiat tab to **Stripe** (PIX first, international cards later): Checkout or Payment Element, preset amounts, backend/session endpoint, webhooks (secrets never in the SPA bundle)

5. **Donations (crypto enhancements)** — WalletConnect, optional on-chain donation history, and contract deploy automation beyond the current Polygon + injected-wallet flow

### Donations (local dev)

Install deps (already in `package.json`): `wagmi`, `viem`, `@tanstack/react-query`.

1. Deploy the reference contract from [`docs/donations-contract.md`](docs/donations-contract.md) to Polygon (chain id `137`).
2. Copy [`.env.example`](.env.example) to `.env` and set:

```env
VITE_DONATION_CONTRACT_ADDRESS=0xYourDeployedAddress
# optional
VITE_POLYGON_RPC_URL=
VITE_WALLETCONNECT_PROJECT_ID=
```

3. Run `pnpm dev`, click **Apoiar / Support** in the navbar, connect MetaMask on Polygon, and send a test donation.

**AI curiosities:** copy [`.env.example`](.env.example) to `.env`, set `LLM_API_KEY` (Groq) and `VITE_AI_API_URL=/api/ai/character-curiosity`, then run `pnpm run dev:all`. See [`docs/spec.md`](docs/spec.md).

---

## Getting started

**Prerequisites:** Node **24** or newer, **pnpm** 10 (within the range declared in `package.json`).

```bash
git clone https://github.com/VRossi18/rick-morty-portal.git
cd rick-morty-portal
pnpm install
pnpm dev
```

Open the URL Vite prints (usually `http://localhost:5173`). In dev, the app lives at the root path. In production, **GitHub Pages** uses the repo subpath (`/rick-and-morty-portal/`); **Cloud Run** uses `/` (see `VITE_BASE` in the deploy job).

To try the 404 page locally, open any path that is not registered (for example `http://localhost:5173/skjdfb`).

### Scripts

| Command                        | Description                                                                                                                 |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                     | Start dev server with HMR                                                                                                   |
| `pnpm build`                   | Typecheck, Vite production build, then copy `dist/index.html` → `dist/404.html` for SPA hosting                             |
| `pnpm preview`                 | Preview the production build locally                                                                                        |
| `pnpm lint`                    | Run ESLint on the project                                                                                                   |
| `pnpm test`                    | Run Vitest once (CI mode)                                                                                                   |
| `pnpm test:watch`              | Run Vitest in watch mode                                                                                                    |
| `pnpm rpg:write-export-sample` | Write `artifacts/rpg-character-export.sample.json` (same schema as the UI export; used in CI for the downloadable artifact) |

These mirror what runs in GitHub Actions so local results should match CI (the `404.html` step runs inside `pnpm build`; the sample JSON step runs in **Lint and test** after tests).
