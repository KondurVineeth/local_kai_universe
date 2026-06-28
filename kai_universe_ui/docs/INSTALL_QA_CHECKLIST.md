# Universe 1.0.0 — Installer QA Checklist

Use this checklist to verify each installer before signing off the v1.0.0
delivery. One section per platform. Run each on a **clean device** — real
hardware or a VM — that has **no prior Universe install**, so the first-run /
Gatekeeper / SmartScreen behavior is exercised exactly as a real user sees it.

**Primary target: macOS Apple Silicon (M-series).** Section A is the must-pass
case; Windows and Linux (Sections B–F) are secondary and can be covered as the
matching hardware is available.

## What was already verified on the build machine (Apple Silicon, macOS)

These passed during the build and do **not** need re-checking:

- `npm run typecheck` — pass
- `npm run lint` — pass (0 warnings)
- `npm run test` — 21/21 pass
- `npm run build` — production build succeeds
- All 6 installer artifacts produced and structurally valid (PE32 / ELF /
  Debian package / signed dmg).
- macOS **arm64** build: launches, spawns full Electron process tree, loads
  `app.asar`, no crash reports, quits cleanly.
- macOS **x64** build: launches under Rosetta 2, spawns GPU + Renderer +
  Network helpers, loads `app.asar`, no crash reports.

What the build machine could **not** verify, and this checklist must cover:

- Visual rendering (no screenshot capture was available in the build env).
- Native Windows and Linux execution (cannot run those OSes on the build Mac).
- Intel-Mac **native** execution (the x64 build was only exercised via Rosetta).
- Installer UX (Gatekeeper / SmartScreen / package-manager flows) on a clean OS.

---

## Artifact reference

| File | Target |
|---|---|
| `Universe-1.0.0-arm64.dmg` | macOS — Apple Silicon |
| `Universe-1.0.0.dmg` | macOS — Intel |
| `Universe-1.0.0-Setup-x64.exe` | Windows — installer |
| `Universe-1.0.0-Portable-x64.exe` | Windows — portable |
| `Universe-1.0.0-x86_64.AppImage` | Linux — universal |
| `zl-universe-fe_1.0.0_amd64.deb` | Linux — Debian/Ubuntu |

Before testing, **download the file through a browser** (or copy it in a way
that sets the OS quarantine flag) — this is what makes the Gatekeeper /
SmartScreen prompts appear. Copying via a shared folder or AirDrop-to-self may
skip the flag and give a falsely clean result.

---

## A. macOS — Apple Silicon (`Universe-1.0.0-arm64.dmg`)

Test on an M-series Mac, macOS 10.15+.

- [ ] dmg mounts on double-click; window shows Universe icon + Applications shortcut.
- [ ] Drag-install to Applications succeeds.
- [ ] First double-click is blocked ("cannot verify the developer").
- [ ] Right-click → Open → Open launches the app.
- [ ] Subsequent launches are a normal double-click (no prompt).
- [ ] Onboarding flow runs: Welcome → Mode → Hardware detection → Recommended models → Setup.
- [ ] Hardware detection reports plausible real values for the test machine.
- [ ] App lands in Chat after setup.
- [ ] Window renders correctly — no blank/transparent areas, dark theme applied.
- [ ] App runs for ~10 min of clicking around without a crash.

## B. macOS — Intel (`Universe-1.0.0.dmg`)

Test on a genuine Intel Mac, macOS 10.15+ (a real Intel Mac — not Rosetta).

- [ ] dmg mounts; drag-install succeeds.
- [ ] First-launch Gatekeeper prompt; right-click → Open works.
- [ ] App launches **natively** (Activity Monitor → Kind shows "Intel", not "Apple").
- [ ] Onboarding completes; lands in Chat.
- [ ] Window renders correctly; 10-min stability pass.

## C. Windows — Installer (`Universe-1.0.0-Setup-x64.exe`)

Test on a clean Windows 10/11 x64 device or VM.

- [ ] Running the installer triggers SmartScreen; "More info → Run anyway" proceeds.
- [ ] Installer lets you choose the install directory.
- [ ] Install completes; Start-menu shortcut "Universe" is created.
- [ ] App launches from the shortcut.
- [ ] Onboarding runs; hardware detection reports plausible values.
- [ ] Window renders correctly; 10-min stability pass.
- [ ] Uninstall via Settings → Apps removes the app cleanly.

## D. Windows — Portable (`Universe-1.0.0-Portable-x64.exe`)

- [ ] Double-click runs the app with no installation step (after SmartScreen).
- [ ] App launches and onboarding runs.
- [ ] Copying the exe to a second location / USB drive still runs.
- [ ] Window renders correctly; short stability pass.

## E. Linux — AppImage (`Universe-1.0.0-x86_64.AppImage`)

Test on a clean Ubuntu 22.04+ (or equivalent) x64 device or VM.

- [ ] `chmod +x` then `./Universe-1.0.0-x86_64.AppImage` launches the app.
- [ ] If a FUSE error appears, `sudo apt install libfuse2` resolves it (note this in the report).
- [ ] Onboarding runs; hardware detection reports plausible values.
- [ ] Window renders correctly; 10-min stability pass.

## F. Linux — Debian package (`zl-universe-fe_1.0.0_amd64.deb`)

Test on a clean Debian/Ubuntu x64 device or VM.

- [ ] `sudo apt install ./zl-universe-fe_1.0.0_amd64.deb` completes without dependency errors.
- [ ] "Universe" appears in the applications menu.
- [ ] Launching from the menu (and via `universe` in a terminal) works.
- [ ] Onboarding runs; window renders correctly; 10-min stability pass.
- [ ] `sudo apt remove zl-universe-fe` uninstalls cleanly.

---

## Per-platform feature smoke pass

On at least one device per OS family, after onboarding, click through each section
and confirm it responds (the UAT report covers code-level correctness — this
just confirms the packaged build behaves the same as `npm run dev`):

- [ ] **Chat** — send a message, get a streamed response, Stop / Regenerate / Branch work.
- [ ] **Discover** — search and filter the catalog; open a model; start a download.
- [ ] **My Models** — Load / Eject a model; the global model picker (⌘L / Ctrl+L) reflects it.
- [ ] **Local Server** — toggle the server on; boot log runs; an endpoint Play button responds.
- [ ] **Developer Docs** — navigate the tree; search panel filters; Esc / ↑ / ↓ work.
- [ ] **Remote** — enable from the disabled state; mock sign-in + simulated peers appear.
- [ ] **Settings** — change the theme; it applies and persists across a restart.

---

## Sign-off

| Platform | Tester | Date | Result | Notes |
|---|---|---|---|---|
| macOS arm64 | | | | |
| macOS Intel | | | | |
| Windows installer | | | | |
| Windows portable | | | | |
| Linux AppImage | | | | |
| Linux deb | | | | |

Delivery is cleared once every row reads PASS (or any failure is documented and
accepted).
