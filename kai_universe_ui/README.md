# Kompact AI Universe — Desktop Frontend

`zl-universe-fe` — the desktop UI for **Kompact AI Universe**: discover, download,
manage, and chat with local language models. Built as a cross-platform
**Electron** app (macOS / Windows / Linux).

> **Read this first if you're integrating the backend.** The UI today runs
> entirely on **in-memory mock data** — no network calls, no server required.
> Wiring it to the real Python backend means replacing a handful of mock
> *adapters* at one well-defined seam. Jump to
> [Backend integration](#backend-integration) for the full guide.

---

## Tech stack

| Concern            | Choice                                             |
| ------------------ | -------------------------------------------------- |
| Shell              | Electron 32                                        |
| Build / dev server | electron-vite 2 (Vite 5 under the hood)            |
| UI                 | React 18, React Router 6                           |
| State              | Redux Toolkit + redux-persist                      |
| Styling            | Tailwind CSS + a DTCG design-token pipeline        |
| Markdown / code    | react-markdown, remark-gfm, rehype-highlight       |
| Language           | TypeScript 5.9 (strict)                            |
| Tests              | Vitest 2 + Testing Library                         |
| Lint               | ESLint with `eslint-plugin-boundaries` (see below) |

---

## Prerequisites

- **Node.js 20 LTS** (18+ works; 20 is what this is developed against).
- **npm** — the repo ships a `package-lock.json`, so use npm, not pnpm/yarn.
- No backend, database, or environment variables are required to run the app.

---

## Quick start

```bash
npm install
npm run dev
```

`npm run dev` launches the Electron app with hot-reload on the renderer. A
desktop window opens — there is **no browser URL**; this is not a web app.

On first launch you'll hit the onboarding wizard (it's a fully local app, so
there's no sign-in). To replay it any time: **Settings → General → Replay
onboarding**, or the **Log out** action in the Settings sidebar footer (it
resets to first-run state; your local data is preserved).

> Design tokens are already inlined into `src/index.html`, so styling works on a
> fresh clone. If you edit tokens under `tokens/`, regenerate with
> `npm run tokens:build` (Vite does **not** hot-reload token changes — restart
> `npm run dev` after building).

---

## Scripts

| Script                     | What it does                                              |
| -------------------------- | --------------------------------------------------------- |
| `npm run dev`              | Electron + Vite dev server with HMR                       |
| `npm run build`            | Typecheck, then production build of all three processes   |
| `npm run typecheck`        | `tsc --noEmit` over app + node configs                    |
| `npm run lint`             | ESLint (zero warnings allowed)                            |
| `npm run lint:fix`         | ESLint with autofix                                       |
| `npm test`                 | Run the Vitest suite once                                 |
| `npm run test:watch`       | Vitest in watch mode                                      |
| `npm run format`           | Prettier write                                            |
| `npm run package:mac`      | Build a macOS distributable (`:win` / `:linux` for those) |
| `npm run scaffold:feature` | Generate a new feature folder with the standard layers    |
| `npm run tokens:build`     | Regenerate design tokens into `src/index.html`            |

---

## Architecture

The codebase is **feature-sliced** with a **clean / hexagonal** layering inside
each feature. The rules are enforced by `eslint-plugin-boundaries`, so the lint
step will fail if you cross a boundary — this is intentional.

```
src/
  app/            Composition root: store, router, DI container, App shell
    container/    createContainer.ts  ← THE place mock vs. real adapters are wired
    store/        Redux store, root reducer, persistence
    router/       Route table + onboarding boot guard
  features/       One folder per product surface (chat, discover, my-models,
                  local-server, settings, onboarding, shell, remote, developer-docs)
  shared/         Cross-cutting code (design-system, domain primitives,
                  container type, infrastructure shared across features, lib)
electron/
  main/           Electron main process (window, hardware bridge)
  preload/        Preload bridge exposed to the renderer
```

### Layers inside a feature

```
<feature>/
  domain/          Entities, value-objects, and PORT interfaces (no I/O)
  application/     Use-cases — orchestration, still no I/O
  infrastructure/  Adapters: repositories, simulators, fixtures, persistence
  presentation/    React components, hooks, Redux slice + selectors + thunks
```

**Boundary rules:**

- A feature may only be imported through its **barrel** (`features/<x>/index.ts`).
  Never reach into another feature's `domain/`, `infrastructure/`, etc.
- `domain` and `application` are I/O-free and framework-free.
- All I/O lives behind a **port** (a TypeScript interface in `domain/ports/`)
  and is implemented by an **adapter** in `infrastructure/`.

### Path aliases

Defined in `electron.vite.config.ts` (and `tsconfig`): `@app`, `@shared`,
`@shared/ds` (design system), and `@features/<name>` for each feature.

---

## Backend integration

This is the part that matters for connecting the Python backend.

### Current state: everything is mocked

The app has **no HTTP client and no API base URL configured** — don't go looking
for a `.env`; there isn't one yet. Every piece of data comes from in-memory
**fixtures** and **simulators**, wired in the composition root:

`src/app/container/createContainer.ts`

```ts
function wireSharedContainer(): SharedContainer {
  const kvStore = createKvStore();
  const modelRepository = new FixtureModelRepository();          // ← mock
  const downloadSimulator = new DownloadProgressSimulator();     // ← mock
  const downloadRepository = new FixtureDownloadRepository(...);  // ← mock
  const systemRepository = new ElectronSystemRepository();        // real (Electron)
  return { kvStore, modelRepository, downloadRepository, systemRepository };
}
```

Each feature contributes its own adapters via `wire<Feature>Container(shared)`.
For example chat (`src/features/chat/index.ts`) wires
`new FixtureChatStreamSimulator()` for streaming responses.

### The integration strategy

You do **not** touch presentation, store, or use-case code. You:

1. Write an **HTTP adapter** that implements an existing **port** interface.
2. **Swap it in** at `createContainer.ts` (and/or the relevant
   `wire<Feature>Container`).

Because the UI only ever talks to the port interface, swapping the adapter is
the entire job — the rest of the app is unaware whether data came from a fixture
or your server.

### Ports to implement (the contracts)

| Port (interface)                                          | Current mock adapter            | What it does                                |
| --------------------------------------------------------- | ------------------------------- | ------------------------------------------- |
| `shared/domain/model/ports/ModelRepository.ts`            | `FixtureModelRepository`        | list / search / findById / staffPicks models |
| `shared/domain/download/ports/DownloadRepository.ts`      | `FixtureDownloadRepository`     | start a model download, track progress      |
| `features/chat/domain/ports/ChatStreamSimulator.ts`       | `FixtureChatStreamSimulator`    | stream an assistant reply chunk-by-chunk    |
| `shared/domain/system/ports/SystemRepository.ts`          | `ElectronSystemRepository`      | hardware detection (already real)           |

> `ChatRepository` (`LocalStorageChatRepository`) persists threads/messages on
> the device and is **not** a backend concern — leave it as-is.

### Expected HTTP API

These are the endpoints the product is specced against (surfaced in the app's
**Local Server → Supported Endpoints** screen, source:
`src/features/local-server/domain/entities/Endpoint.ts`). Base host in the mock
logs is `http://localhost:1234`.

**Kompact AI Universe (native):**

| Method | Path                                      | Purpose               |
| ------ | ----------------------------------------- | --------------------- |
| GET    | `/api/v1/models`                          | List loaded models    |
| POST   | `/api/v1/chat`                            | Send a chat message   |
| POST   | `/api/v1/models/load`                     | Load a model          |
| POST   | `/api/v1/models/download`                 | Download a model      |
| GET    | `/api/v1/models/download/status/:job_id`  | Download status       |

**OpenAI-compatible:** `GET /v1/models`, `POST /v1/responses`,
`POST /v1/chat/completions`, `POST /v1/completions`, `POST /v1/embeddings`

**Anthropic-compatible:** `POST /v1/messages`, `GET /v1/models`

### The streaming contract

Chat responses stream. The port returns an `AsyncIterable<MessageChunk>`; the UI
dispatches each chunk as it arrives. Your `HttpChatStreamSimulator` should
consume the backend's streamed response (e.g. SSE) and `yield` chunks shaped as:

```ts
interface MessageChunk {
  threadId: ThreadId;
  messageId: MessageId;
  delta: string;                       // incremental text
  done: boolean;                       // true on the final chunk
  kind?: 'body' | 'reasoning';         // 'reasoning' → renders in the "Thought for Xs" disclosure
  stopReason?: SimulateStopReason;     // optional, set on the final chunk
}
```

The port (`features/chat/domain/ports/ChatStreamSimulator.ts`) already documents
this and passes inference config (temperature, stop strings, system prompt,
enabled tools, sampling knobs) into `simulate(...)` — map those onto your
request body. Honor the `AbortSignal` in options so the Stop button cancels the
HTTP stream mid-flight.

### Suggested first step

Implement `HttpModelRepository implements ModelRepository` (the read-only model
list is the simplest surface), point it at your base URL, swap it into
`wireSharedContainer()`, and confirm the **Discover** and **My Models** screens
populate from the server. Then move on to the chat stream. Add an API base-URL
config (a new entry under `src/shared/config/` or a Vite env var read via
`import.meta.env`) rather than hardcoding the host.

---

## Build & package

```bash
npm run build          # typecheck + build main / preload / renderer
npm run package:mac    # macOS distributable (also :win, :linux, :mac-arm64)
```

Packaging config lives in `electron-builder.yml`.

---

## More docs

- `docs/USER_GUIDE.md` — end-user walkthrough of every screen
- `docs/uat-plan.md`, `docs/uat-report.md` — QA plan and results
- `docs/INSTALL_QA_CHECKLIST.md` — install verification checklist
- `docs/design-system/token-usage.md` — how to consume design tokens
- `src/features/<name>/README.md` — per-feature notes
