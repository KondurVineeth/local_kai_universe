# ZL Universe FE — UAT Plan

> Generated 2026-05-19. Baseline: `main` post PR #77 (all stubs reverted, full feature surface live).
> Companion doc: `docs/edge-case-audit.md` for non-happy-path coverage.

## How this doc is structured

The CSV (`docs/source-scope.csv`) defines 8 L1 capabilities. Real users
don't exercise the app L2-by-L2 — they take **journeys** that cut across
multiple L1s. So this UAT plan is organised by **journey first** then
drilled into per-L2 test cases inside each journey.

Each test case is **verifiable from source code** — a UAT-verifier agent
reads the named files, traces the wiring, and marks `PASS` or `FAIL`
with file:line evidence. Cases that require human eyes (visual fidelity,
animation smoothness, real keyboard interaction) are tagged `MANUAL`
and excluded from the automated pass/fail count.

### Severity legend
- **S0 — must pass** to ship. Failure blocks the demo.
- **S1 — should pass.** Failure is a known regression but workable.
- **S2 — nice-to-have.** Polish.

---

## Journeys

| # | Journey | L1s touched | Cases |
|---|---|---|---|
| J1 | First-run onboarding | Onboarding, Shell | 12 |
| J2 | Discover → install a model | Discover, Shell, My Models | 10 |
| J3 | Load a model + open a chat | Shell, Chat, My Models | 8 |
| J4 | Send messages + manage streams | Chat | 14 |
| J5 | Organise chats (folders, search, multi-select) | Chat | 11 |
| J6 | Configure inference (presets, system prompt, sampling) | Chat | 10 |
| J7 | Start the Local Server + observe traffic | Local Server, Chat | 9 |
| J8 | Browse Developer Docs | Developer Docs | 6 |
| J9 | Pair a Remote device | Remote, Settings | 7 |
| J10 | Customise app settings | Settings, Shell | 8 |
| J11 | Manage installed models (My Models) | My Models, Shell | 11 |

**Total: 106 cases** (~85 automated, ~21 MANUAL)

---

## J1 — First-run onboarding

**Goal:** A new user can launch the app, accept hardware detection, pick a starter model, and land in a chat-ready state with one model loaded.

### J1-UC1 — Welcome → Mode → Hardware → Recommendation → Setup (happy path)
| # | Severity | Case | Verify |
|---|---|---|---|
| J1.1 | S0 | App boots to `/onboarding/welcome` on first launch | `OnboardingBootGuard` redirects when `completed=false` |
| J1.2 | S0 | Welcome's "Get Started" routes to `/onboarding/mode` | WelcomeScreen `onContinue` navigation |
| J1.3 | S0 | Mode screen persists User/Developer choice | `modeSelected` action + persist whitelist |
| J1.4 | S0 | Hardware detect dispatches probe via Electron IPC | `detectHardwareThunk` calls `window.universe.detectHardware()` |
| J1.5 | S0 | Recommendation screen renders 3 tiers when ≥3 chat models exist | `RecommendStarterModels.execute` |
| J1.6 | S0 | Continue is disabled until a starter is selected | `onContinue` guard on `!selectedId` |
| J1.7 | S0 | Setup screen runs mock download, dispatches `modelInstalled` + `loadModelThunk` | `completeOnboardingThunk` |
| J1.8 | S0 | After Setup, user lands at `/chat/:id` with model loaded | Setup `useEffect` post-completion navigation |

### J1-UC2 — Recovery paths
| # | Severity | Case | Verify |
|---|---|---|---|
| J1.9 | S1 | Hardware probe failure surfaces error + Retry button | `hardwareDetectionFailed` + DetectionError component |
| J1.10 | S1 | Empty recommendations show "No starter models" branch with Discover CTA | StarterModelScreen empty branch (PR #57) |
| J1.11 | S1 | Stale `selectedModelId` after re-probe is cleared | `hardwareDetected` reducer drops it (PR #57) |
| J1.12 | S1 | Skip → onboardingCompleted + navigate to `/discover` | `onSkip` handler |

---

## J2 — Discover → install a model

**Goal:** From a clean install ledger, user searches Discover, picks a model, sees compat tier, downloads, and the model appears in My Models.

### J2-UC1 — Search + filter
| # | Severity | Case | Verify |
|---|---|---|---|
| J2.1 | S0 | Search input filters list by displayName + tags + author | `applyDiscoverFilters` selector |
| J2.2 | S0 | Format filter (GGUF / MLX / All) narrows the variant pool | `applyDiscoverFilters` format branch |
| J2.3 | S1 | Reset Filters button clears format + sort but NOT search query | `ModelListing` reset onClick |
| J2.4 | S1 | Sidebar category (LLMs / Vision / Reasoning / Staff Picks) filters list | `categorySet` reducer + selector |

### J2-UC2 — Detail + download
| # | Severity | Case | Verify |
|---|---|---|---|
| J2.5 | S0 | Click row → URL → `/discover/:id`, detail pane populates | DiscoverPage `useEffect` URL sync |
| J2.6 | S0 | Hardware Compatibility badge reflects real hw tier (not static "Possible") | `computeCompatibility` use case (PR #56) |
| J2.7 | S0 | Download button progresses idle → downloading → completed | `startModelDownloadThunk` + DownloadButton |
| J2.8 | S0 | Completed download dispatches `modelInstalled` to my-models slice | Thunk completion handler |
| J2.9 | S1 | Variant picker locks during in-flight download | `disabled={inFlight}` (PR #56) |
| J2.10 | S1 | Failed download shows Retry, not stale progress | `DownloadButton` failed branch (PR #56) |

---

## J3 — Load a model + open a chat

**Goal:** Picker → model loads → `/chat` lands on an editable composer; the model can answer.

| # | Severity | Case | Verify |
|---|---|---|---|
| J3.1 | S0 | Picker opens via header click + ⌘L | `GlobalModelPicker` + useGlobalShortcuts |
| J3.2 | S0 | Selecting a model dispatches `loadModelThunk` | onSelectModel handler |
| J3.3 | S0 | Selecting during eject is blocked (rows disabled) | ResultsBody `ejecting` prop (PR #53) |
| J3.4 | S0 | Model picker shows current loaded model w/ Eject affordance | CurrentlyLoaded component |
| J3.5 | S0 | After load, `/chat` index auto-creates or reuses empty thread | ChatIndexRedirect (PR #49) |
| J3.6 | S0 | One-and-only empty-thread rule enforced across folders | `createThread` reducer (PR #72) |
| J3.7 | S0 | Composer is enabled when model loaded; disabled message otherwise | ChatInputDock gating |
| J3.8 | S1 | Auto-restore on app reload re-loads last-good model | `useAutoRestoreLastModel` |

---

## J4 — Send messages + manage streams

**Goal:** Send → stream → manage in-flight (stop / regenerate / continue / edit).

| # | Severity | Case | Verify |
|---|---|---|---|
| J4.1 | S0 | Enter sends, Shift-Enter newlines | useComposer keydown handler |
| J4.2 | S0 | Stop button aborts the in-flight stream | abortStream + Stop button |
| J4.3 | S0 | Regenerate truncates from chosen msg + re-streams | regenerateThunk |
| J4.4 | S0 | Continue extends a "cancelled" or "length-cap" assistant msg | continueThunk + canContinue guard |
| J4.5 | S0 | Branch creates new thread + navigates to it | branchFromMessageThunk + AssistantMessage navigate |
| J4.6 | S0 | Edit user msg → Save & Resend re-runs assistant turn | editAndResendThunk |
| J4.7 | S0 | Delete user msg drops msg + all subsequent assistant content | deleteMessageThunk |
| J4.8 | S0 | Chat sends bridge to Local Server log when server running | sendMessageThunk → simulateRequestThunk (PR #70) |
| J4.9 | S0 | Reload mid-stream marks all streaming msgs as stopped | markAllStoppedOnHydrate |
| J4.10 | S1 | Reasoning toggle persists per-thread | reasoningOverrideByThread |
| J4.11 | S1 | Context usage dial reflects token count + warns near cap | ContextUsageDial + useUsedTokens |
| J4.12 | S1 | Slash commands open command palette | useComposer slash detection |
| J4.13 | S1 | Attach file via popover or drag/drop | useFileIngestion |
| J4.14 | S2 | Per-message metrics footer shows tokens + tok/s + elapsed | MessageMetrics |

---

## J5 — Organise chats (folders, search, multi-select)

| # | Severity | Case | Verify |
|---|---|---|---|
| J5.1 | S0 | "Create folder" button is visually distinct from folder rows | dashed-border button (PR #76) |
| J5.2 | S0 | Folder rename inline persists via renameFolder | FolderRow rename input + commit |
| J5.3 | S0 | Drag chat onto folder dispatches moveThreadToFolder | useChatDnd + droppable |
| J5.4 | S0 | Delete folder cascades child threads to repo (not just slice) | deleteFolderThunk (PR #54) |
| J5.5 | S0 | Delete option hidden on empty threads | onAskDelete null-check in ThreadRow (PR #49) |
| J5.6 | S0 | "Move to folder" hides current folder + "No folder" when unfiled | RowActionsMenu filter (PR #49) |
| J5.7 | S0 | Search filters threads via case-insensitive includes | useSidebarBuckets + query |
| J5.8 | S0 | Multi-select via Shift-click + bulk delete/move | toggleMultiSelectThread + bulk actions |
| J5.9 | S1 | Sort menu (Recent / Alphabetical / Oldest) reorders correctly | useSidebarBuckets sort branch |
| J5.10 | S1 | Folder color picker persists per folder | setFolderColor + folderColorClass |
| J5.11 | S2 | Marquee drag selects multiple chats | useMarqueeSelection |

---

## J6 — Configure inference (presets, system prompt, sampling)

| # | Severity | Case | Verify |
|---|---|---|---|
| J6.1 | S0 | Preset Manager save / load / duplicate / delete work | configSlice preset reducers |
| J6.2 | S0 | System Prompt edits persist + apply to next send | SystemPromptPanel + buildSimulateConfig |
| J6.3 | S0 | Sampling sliders (temperature, topK, topP, minP) update config | SamplingPanel |
| J6.4 | S0 | Structured Output schema validates JSON inline | StructuredOutputPanel parser |
| J6.5 | S0 | Speculative Decoding picker only lists installed small models | SpeculativeDecodingPanel filter |
| J6.6 | S0 | Conversation Notes panel persists per-thread | NotesPanel + notesByThread |
| J6.7 | S1 | Stop strings list edits trim + persist | ModelSettingsPanel stop-strings input |
| J6.8 | S1 | Context Overflow strategy persists | configSlice contextOverflow |
| J6.9 | S2 | ⌘E opens System Prompt editor modal | useGlobalShortcuts |
| J6.10 | S2 | Inference panel hidden in User mode | ChatInferencePanel mode gate |

---

## J7 — Start Local Server + observe traffic

| # | Severity | Case | Verify |
|---|---|---|---|
| J7.1 | S0 | Server toggle dispatches start/stop thunks (not raw boolean) | LocalServerTopBar handleToggle (PR #70) |
| J7.2 | S0 | Lifecycle walks stopped → starting → running with progressive boot logs | startServerThunk timer chain (PR #70) |
| J7.3 | S0 | Stop mid-startup cancels queued boot-log timers | stopServerThunk cancellation (PR #70) |
| J7.4 | S0 | Chat message → simulated POST /v1/chat/completions log entry | sendMessageThunk bridge (PR #70) |
| J7.5 | S0 | Per-endpoint Play button fires simulateRequestThunk | EndpointRow onTry (PR #70) |
| J7.6 | S1 | Synthetic traffic toggle emits ambient requests every 5-8s | SyntheticTrafficRunner (PR #70) |
| J7.7 | S0 | Sidebar Vitals card shows status / port / live uptime / request count | LocalServerSecondarySidebar VitalsCard (PR #70) |
| J7.8 | S1 | API Catalog nav in sidebar switches endpoints tab | LocalServerSecondarySidebar ApiCatalogNav |
| J7.9 | S1 | Restart action chains stop → start | Quick Actions onRestart |

---

## J8 — Browse Developer Docs

| # | Severity | Case | Verify |
|---|---|---|---|
| J8.1 | S0 | Sidebar tree collapse/expand persists via redux-persist | DeveloperDocsSecondarySidebar + persist whitelist |
| J8.2 | S0 | Internal markdown anchors route via react-router (no full reload) | MarkdownRenderer Anchor (PR #58) |
| J8.3 | S0 | Breadcrumb root + sections are clickable buttons | DocsBreadcrumb (PR #58) |
| J8.4 | S0 | Document-not-found has explicit CTA back to introduction | DocPagePage `if (!current)` branch (PR #58) |
| J8.5 | S1 | Search panel filters docs by content; ESC + arrow nav | DocsSearchPanel |
| J8.6 | S2 | "Copy as Markdown" + "Show on Web" actions work | DocHeader handlers |

---

## J9 — Pair a Remote device

| # | Severity | Case | Verify |
|---|---|---|---|
| J9.1 | S0 | Settings → LM Link → Enable toggle flips on | LmLinkPanel + remoteEnabledChanged |
| J9.2 | S0 | When disabled in Settings, Remote page shows DisabledEmptyState with deep-link CTA | RemotePage + selectRemoteEnabled (PRs #60, #66) |
| J9.3 | S0 | Deep link `/settings/lm-link#enable-remote` scrolls + highlights the row | SettingRow useScrollIntoViewOnHash (PR #66) |
| J9.4 | S0 | Auth flow: unauth → click Login → 3s "Complete in browser…" → authenticated | mockLoginThunk + LandingScreen |
| J9.5 | S0 | Retry during authenticating clears stale timer (no silent auto-auth later) | cancelLoginThunk (PR #65) |
| J9.6 | S0 | Authenticating state scrubbed to unauthenticated on rehydrate | remoteCommittedOnlyTransform (PR #65) |
| J9.7 | S1 | Add Device wizard → 3-5s spawn → device appears in sidebar | scheduleSimulatedPeerThunk |

---

## J10 — Customise app settings

| # | Severity | Case | Verify |
|---|---|---|---|
| J10.1 | S0 | Settings index redirects to /settings/general | SettingsPage Navigate |
| J10.2 | S0 | 9 panels reachable via SettingsSecondarySidebar | settings routes |
| J10.3 | S0 | Theme / Language / Mode toggles persist | settings slice + persist transform |
| J10.4 | S0 | Replay onboarding blocked during active stream or mid-load | OnboardingSection guards (PR #60) |
| J10.5 | S0 | Replay onboarding shows ConfirmDialog before destructive reset | ReplayOnboardingGroup confirm state (PR #60) |
| J10.6 | S1 | Right-panel toggle hidden on Settings (no contextual content) | RightPanelToggle ROUTES_WITHOUT_RIGHT_PANEL (PR #69) |
| J10.7 | S1 | macOS Hardware panel handles probe failure gracefully | electron/main/hardware.ts try/catch |
| J10.8 | S1 | Server Settings popover persists port + auth config | ServerSettingsPopover handlers |

---

## J11 — Manage installed models (My Models)

| # | Severity | Case | Verify |
|---|---|---|---|
| J11.1 | S0 | Landing on My Models auto-selects first installed model | MyModelsPage useEffect (PR #69) |
| J11.2 | S0 | Right rail lives in shell slot, no dual-column overlap | MyModelsRightRailSlot via RightPanelPlaceholder (PR #73) |
| J11.3 | S0 | "Load Model" button on rail wires to loadModelThunk | RailActions handleLoadOrEject (PR #55) |
| J11.4 | S0 | "Use in New Chat" loads + navigates to /chat | RailActions handleUseInNewChat (PR #55) |
| J11.5 | S0 | Row context menu Delete with ConfirmDialog → modelUninstalled + auto-eject if loaded | RowActionsMenu onConfirmDelete (PR #55) |
| J11.6 | S0 | LoadTab Context Length + GPU Offload sliders update slice | LoadTab onChange handlers (PR #61) |
| J11.7 | S0 | Empty / NaN input on LoadTab doesn't dispatch NaN | safeNumber guard (PR #61) |
| J11.8 | S0 | Source File Override switch + path input persist | LoadTab Advanced section (PR #61) |
| J11.9 | S0 | InfoTab renders model.description when present | DescriptionSection (PR #62) |
| J11.10 | S1 | Table column sort (Model / Params / Size / Modified) preserves pinned-first | sortModelsKeepingPinnedFirst (PR #62) |
| J11.11 | S1 | DiskUsageFooter shows accurate total + count of installed models | DiskUsageFooter computation |

---

## Out-of-journey: Cross-cutting checks (not run by per-L1 agents)

| # | Severity | Case | Owner |
|---|---|---|---|
| X1 | S0 | `npm run typecheck` passes | gates agent |
| X2 | S0 | `npm run lint` passes with 0 warnings | gates agent |
| X3 | S0 | `npm run test` passes | gates agent |
| X4 | S0 | `npm run build` produces out/ artifacts | gates agent |
| X5 | S0 | macOS arm64 DMG packages cleanly | gates agent |
| X6 | S1 | No console errors thrown on app boot | MANUAL |
| X7 | S1 | Window restores at last position | MANUAL |
| X8 | S1 | Cmd+Q exits cleanly | MANUAL |

---

## Verification protocol

For each test case, the assigned agent:

1. Reads the named files
2. Traces the code path from user action → reducer/thunk → expected state
3. Marks `PASS` (with `file:line` citation) or `FAIL` (with reason)
4. For `MANUAL` cases: marks `MANUAL — not auto-verifiable`
5. Returns a structured table

The final `docs/uat-report.md` aggregates all verdicts and computes:
- S0 pass rate (must be 100% to ship)
- S1 pass rate (target ≥90%)
- S2 pass rate (informational)
- Static-gate results (X1-X5)
