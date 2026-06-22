# Sketchify

A collaborative, Excalidraw-powered whiteboard for sketching diagrams, wireframes, and ideas — with cloud persistence, view-only link sharing, and **realtime multiplayer rooms**.

> Live demo: **[sketchify-web-umber.vercel.app](https://sketchify-web-umber.vercel.app)**

Sketchify takes the excellent open-source [`@excalidraw/excalidraw`](https://github.com/excalidraw/excalidraw) canvas and wraps it in a full product: accounts, a personal canvas that follows you across devices, shareable read-only snapshots, and live collaboration rooms where multiple people draw together with cursors and host controls.

---

## Table of contents

- [What it does](#what-it-does)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Data model](#data-model)
- [Getting started locally](#getting-started-locally)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Deployment](#deployment)
- [Roadmap / status](#roadmap--status)

---

## What it does

Sketchify provides a single hand-drawn-style drawing canvas with four layers of capability:

### 🎨 Drawing canvas (everyone)
- The full Excalidraw editor as the landing page — shapes, arrows, freehand, text, images, libraries, light/dark theme.
- No sign-up required to start drawing.

### 💾 Persistence
- **Anonymous users** → the drawing is saved to **`localStorage`**, so it survives page reloads on the same browser.
- **Signed-in users** → the drawing is saved to a **Postgres database** (one canvas per user), so it syncs across every device they log in from.
- **Migration on login** — if you draw something while signed out and then log in, your in-progress local scene is migrated into your account (when your cloud canvas is empty) so nothing is lost.

### 🔗 Export & link sharing (signed-in users)
- Export selected elements as **PNG** or **SVG** (theme-aware).
- Generate a **view-only share link** (`/share/[id]`) that renders a read-only snapshot of the selected elements — no account needed to view.

### 👥 Realtime collaboration (signed-in users)
- Create a **collaboration room** and share the invite link.
- Joining requires authentication (anonymous visitors are bounced to sign-in and then returned to the room — no anonymous participants).
- **Live scene sync** — everyone's shapes update in realtime (last-write-wins per element).
- **Live cursors** with name labels and per-user colors, rendered via Excalidraw's native collaborator support.
- **Host controls** — the room creator can:
  - See a participant panel with everyone's name and role.
  - Toggle each participant between **can-draw** and **view-only**.
  - **Kick** a participant.
  - **End the room** for everyone.
- **Save to my canvas** — any participant can copy the room scene into their own personal canvas. The copy is **offset and appended** into empty space (shifted right of existing work) so it never overwrites or overlaps what you already had. Double-saving is safe (deduped by element id).

---

## How it works

### Persistence layer
There is one canvas component (`Workspace.tsx`) with a swappable storage layer chosen by session state:

- `lib/localScene.ts` — read/write the scene to `localStorage` (anonymous users).
- `lib/dbScene.ts` — read/write the scene via the auth-gated `GET/PUT /api/drawing` route (signed-in users).
- `lib/scene.ts` — `serializeScene` (drops deleted elements, whitelists `appState` keys) and `isSceneNonEmpty` helpers shared by both stores.

The canvas resolves its initial data once on mount and autosaves on a trailing debounce (≈600ms), flushing on `pagehide`/`visibilitychange` so nothing is lost when you close the tab.

**Login migration rule:** on login, if the local scene is non-empty **and** the cloud canvas is empty → migrate local → DB and clear local. If both are non-empty → the DB canvas wins and the local copy is discarded.

### Sharing
The **Share** flow puts the canvas into a "select elements" mode; once you've selected something, a dialog offers PNG / SVG export or "Share via link". A link creates a `Share` row (`POST /api/share`) and returns a `cuid`; visiting `/share/[id]` server-fetches that snapshot and renders it in a read-only Excalidraw (`viewModeEnabled`, fit-to-content).

### Realtime collaboration
Collaboration runs over a **raw WebSocket** server (`apps/ws-server`), kept deliberately **database-free** so it can be hosted anywhere:

1. The web app mints a short-lived **JWT** (`GET /api/collab/token`) containing `{ userId, name, image, roomId, host }`. The `host` flag is derived from the DB `Room.hostId`.
2. The browser opens a WebSocket to `NEXT_PUBLIC_WS_URL` and sends a `join` message with the token. On the first join, the client seeds the room scene from the DB (`initialScene`) so rooms survive refreshes/disconnects.
3. The ws-server holds **participants, permissions, and the live scene in memory** and relays `scene-update`, `cursor`, `set-permission`, `kick`, and `end-room` messages between connections.
4. **Durability:** the host's browser autosaves the room scene back to the DB (`PUT /api/rooms/[id]`, debounced ≈1.2s), so joiners can rehydrate it server-side.

Scene sync carries **elements + files only** (not `appState`), so every participant keeps their own viewport/zoom. An id+version signature (`sceneSig`) dedupes echoes to prevent feedback loops between drawers.

Because the JWT secret (`COLLAB_JWT_SECRET`) must match between the web app and the ws-server, the two services are loosely coupled but cryptographically linked.

---

## Tech stack

| Area | Technology |
|------|------------|
| Monorepo | [Turborepo](https://turborepo.dev/) + [pnpm](https://pnpm.io/) workspaces |
| Web app | [Next.js 16](https://nextjs.org/) (App Router, Turbopack), [React 19](https://react.dev/) |
| Canvas | [`@excalidraw/excalidraw`](https://www.npmjs.com/package/@excalidraw/excalidraw) v0.18 |
| Auth | [NextAuth (Auth.js) v5](https://authjs.dev/) — Credentials + Google + GitHub, JWT sessions, bcrypt password hashing |
| Database | [PostgreSQL](https://www.postgresql.org/) (e.g. [Neon](https://neon.tech/)) via [Prisma 7](https://www.prisma.io/) with the `@prisma/adapter-pg` driver adapter |
| Realtime | Node.js [`ws`](https://github.com/websockets/ws) WebSocket server (run with [`tsx`](https://github.com/privatenumber/tsx)) + `jsonwebtoken` |
| Styling | [Tailwind CSS 3](https://tailwindcss.com/) |
| Tooling | TypeScript 5.9, ESLint 9, Prettier 3 |

---

## Repository layout

```
.
├── apps/
│   ├── web/          # Next.js app — canvas, auth, persistence, sharing, collab UI
│   │   ├── app/      # App Router pages + API routes (drawing, share, rooms, collab token, auth, signup)
│   │   ├── components/# Workspace, CollabWorkspace, RoomBar, ShareDialog, Topbar, auth UI, …
│   │   ├── lib/      # scene serialization, local/db stores, export, share, collab token & types
│   │   └── auth.ts   # NextAuth configuration
│   └── ws-server/    # Realtime collaboration WebSocket server (database-free)
│       └── src/      # index.ts (server), protocol.ts, auth.ts (JWT), rooms.ts (in-memory registry)
├── packages/
│   ├── db/           # Prisma schema + generated client, re-exported as `db/client`
│   ├── ui/           # Shared React components
│   ├── eslint-config/# Shared ESLint config
│   └── typescript-config/ # Shared tsconfig bases
├── turbo.json        # Turborepo task pipeline
└── pnpm-workspace.yaml
```

---

## Data model

Prisma models (Postgres):

- **`User`** — auth identity; has one `Drawing`, many `Room`s, plus NextAuth `Account`/`Session`.
- **`Drawing`** — one personal canvas per user (`userId @unique`); stores `elements`, `appState`, `files` as JSON.
- **`Room`** — a collaboration room owned by a host (`hostId`); persists the room scene (`elements`/`appState`/`files`) and an `isActive` flag.
- **`Share`** — an immutable read-only snapshot for a view-only link (optional `userId`).
- **`Account` / `Session` / `VerificationToken`** — standard NextAuth/Prisma adapter models.

---

## Getting started locally

### Prerequisites
- **Node.js** ≥ 18
- **pnpm** 9 (`corepack enable` will provide it, or `npm i -g pnpm@9`)
- A **PostgreSQL** database (a free [Neon](https://neon.tech/) project works great)

### 1. Clone & install

```bash
git clone <your-fork-url> sketchify
cd sketchify
pnpm install
```

### 2. Configure environment variables

Create the env files described in [Environment variables](#environment-variables) below:

- `apps/web/.env.local` — database, auth secret, OAuth creds, collab secret, ws URL.
- `apps/ws-server/.env` — port + the **same** collab secret (see `apps/ws-server/.env.example`).

### 3. Set up the database

```bash
# from the repo root
cd packages/db

# generate the Prisma client
pnpm prisma generate

# apply the schema to your database
pnpm prisma migrate deploy      # or: pnpm prisma db push
```

> Prisma reads `DATABASE_URL` from the environment. Make sure it's exported or present in a `.env` Prisma can see (e.g. `packages/db/.env`).

### 4. Run the apps

Run **both** the web app and the WebSocket server (collaboration needs the ws-server).

```bash
# Terminal A — web app  →  http://localhost:3000
pnpm --filter web dev

# Terminal B — realtime collab server  →  ws://localhost:8080
pnpm --filter ws-server dev
```

Or start everything via Turborepo from the root:

```bash
pnpm dev
```

Open **http://localhost:3000** and start drawing. Sign up to get a cloud-synced canvas, share links, and collaboration rooms.

---

## Environment variables

### `apps/web/.env.local`

```bash
# --- Database (Prisma / Postgres) ---
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# --- NextAuth (Auth.js) ---
AUTH_SECRET="a-long-random-string"        # generate with: npx auth secret
AUTH_URL="http://localhost:3000"          # base URL of the web app

# --- OAuth providers (optional, but needed for Google/GitHub sign-in) ---
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
AUTH_GITHUB_ID="..."
AUTH_GITHUB_SECRET="..."

# --- Realtime collaboration ---
COLLAB_JWT_SECRET="a-long-random-string-shared-with-ws-server"
NEXT_PUBLIC_WS_URL="ws://localhost:8080"  # use wss://... in production
```

### `apps/ws-server/.env`

```bash
PORT=8080
COLLAB_JWT_SECRET="a-long-random-string-shared-with-ws-server"  # MUST match the web app
```

> ⚠️ **`COLLAB_JWT_SECRET` must be identical** in `apps/web` and `apps/ws-server`, or the WebSocket server will reject every join token. OAuth providers are optional — email/password (Credentials) sign-up works without them.

---

## Available scripts

Run from the repository root (Turborepo fans out to each workspace):

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Start all apps in dev mode (web + ws-server). |
| `pnpm build` | Build all apps and packages. |
| `pnpm lint` | Lint every workspace (`--max-warnings 0`). |
| `pnpm check-types` | Type-check every workspace. |
| `pnpm format` | Prettier-format all `.ts/.tsx/.md` files. |

Target a single app with a filter, e.g. `pnpm --filter web dev` or `pnpm build --filter web`.

---

## Deployment

Sketchify is two separately deployed services:

1. **Web app (`apps/web`)** → deployed on **Vercel**. Set all `apps/web` env vars in the Vercel project (with `NEXT_PUBLIC_WS_URL` pointing at the public `wss://` URL of the ws-server and `AUTH_URL` set to the production domain).

2. **WebSocket server (`apps/ws-server`)** → Vercel cannot host long-lived WebSocket connections, so this must run on a **persistent host** (e.g. Render, Railway, Fly.io, or any VPS). It exposes a `/health` endpoint for platform health checks. Set `PORT` and the shared `COLLAB_JWT_SECRET` there.

> The reference deployment runs the web app on Vercel and the ws-server on Render's free tier (note: free tiers sleep when idle, so the first collaboration connect after a cold start can take ~30–60s).

Because the ws-server is database-free, it needs no `DATABASE_URL` — only `PORT` and `COLLAB_JWT_SECRET`.

---

## Roadmap / status

- ✅ Canvas as landing page + custom auth UI (Credentials + Google + GitHub)
- ✅ Persistence (localStorage for anon, Postgres for signed-in, migrate-on-login)
- ✅ Export (PNG/SVG) + view-only link sharing
- ✅ Realtime collaboration (rooms, live sync, cursors, host controls, save-to-canvas)

---

## Acknowledgements

Built on the open-source [Excalidraw](https://github.com/excalidraw/excalidraw) editor. Scaffolded with [Turborepo](https://turborepo.dev/).
