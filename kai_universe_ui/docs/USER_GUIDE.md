# Universe — User Guide

**Version 1.0.0** · Ziroh Labs Private Limited

Universe is a desktop application for discovering, managing, and chatting with
local language models. This guide covers installation on every supported
platform and a walkthrough of each part of the app.

---

## Contents

1. [About this build](#1-about-this-build)
2. [System requirements](#2-system-requirements)
3. [Choosing the right installer](#3-choosing-the-right-installer)
4. [Installation — macOS](#4-installation--macos)
5. [Installation — Windows](#5-installation--windows)
6. [Installation — Linux](#6-installation--linux)
7. [First launch & onboarding](#7-first-launch--onboarding)
8. [The interface](#8-the-interface)
9. [Feature walkthrough](#9-feature-walkthrough)
10. [Keyboard shortcuts](#10-keyboard-shortcuts)
11. [Data, storage & privacy](#11-data-storage--privacy)
12. [Troubleshooting](#12-troubleshooting)
13. [Uninstalling](#13-uninstalling)

---

## 1. About this build

This is the **v1.0.0 interactive build** of Universe. Every screen, panel,
menu, and control is functional and responds with realistic data. The build
runs entirely on your machine — it performs **no network calls to a model
provider** and downloads no real model weights. Hardware detection is real
(it reads your actual CPU, RAM, and GPU); model inference is simulated locally
so the full product experience can be explored without a backend.

The installers in this release are **not code-signed with a paid developer
certificate**. They are ad-hoc signed (macOS) or unsigned (Windows). This is
expected and safe — it only means the operating system will show a one-time
"unverified developer" prompt on first launch. Sections 4 and 5 explain how to
clear that prompt. Full notarization is a future step that requires a paid
Apple Developer Program / Windows code-signing certificate.

---

## 2. System requirements

| Platform | Minimum |
|---|---|
| macOS | macOS 10.15 Catalina or newer — Apple Silicon **or** Intel |
| Windows | Windows 10 (64-bit) or newer |
| Linux | A modern 64-bit distribution (Ubuntu 20.04+, Fedora 36+, Debian 11+ or equivalent) |
| Memory | 4 GB RAM minimum, 8 GB recommended |
| Disk | ~600 MB free for installation |
| Display | 1280 × 800 or larger |

The application is 64-bit only. There is no 32-bit or ARM-Linux build in this
release.

---

## 3. Choosing the right installer

The release contains six files. Pick **one** for your machine:

| File | Platform | Use when |
|---|---|---|
| `Universe-1.0.0-arm64.dmg` | macOS — Apple Silicon | Your Mac has an M1/M2/M3/M4 chip |
| `Universe-1.0.0.dmg` | macOS — Intel | Your Mac has an Intel processor |
| `Universe-1.0.0-Setup-x64.exe` | Windows | Standard install with Start-menu shortcut |
| `Universe-1.0.0-Portable-x64.exe` | Windows | Run without installing (e.g. from a USB drive) |
| `Universe-1.0.0-x86_64.AppImage` | Linux | Any distribution — no install, just run |
| `zl-universe-fe_1.0.0_amd64.deb` | Linux — Debian/Ubuntu | Integrated install via the system package manager |

**Not sure which Mac you have?** Apple menu → *About This Mac*. If it lists a
"Chip" (e.g. "Apple M2"), use the **arm64** dmg. If it lists a "Processor"
(e.g. "Intel Core i7"), use the plain `.dmg`. The Apple Silicon build will also
run on Intel-incompatible setups via translation, but the matching build is
always faster.

---

## 4. Installation — macOS

1. Double-click the `.dmg` file you downloaded. A window opens showing the
   **Universe** app icon next to an **Applications** folder shortcut.
2. Drag the **Universe** icon onto the **Applications** folder.
3. Eject the disk image (drag it to the Trash, or press ⌘E in Finder).
4. Open **Applications** and locate **Universe**.

### First launch — clearing the Gatekeeper prompt

Because this build is ad-hoc signed rather than notarized, macOS shows a
warning the **first time only**. Do this:

1. **Right-click** (or Control-click) the Universe app → choose **Open**.
2. A dialog appears: *"macOS cannot verify the developer of Universe."*
   Click **Open**.
3. The app launches. Every subsequent launch is a normal double-click — the
   prompt does not appear again.

> If double-clicking shows *"Universe is damaged and can't be opened"* with no
> Open button, the right-click → Open step was skipped. Open **Terminal** and
> run:
> ```
> xattr -dr com.apple.quarantine /Applications/Universe.app
> ```
> then launch the app normally. This removes the download-quarantine flag.

Alternatively: after the first blocked launch, go to **System Settings →
Privacy & Security**, scroll to the Security section, and click **Open Anyway**
next to the Universe entry.

---

## 5. Installation — Windows

This build is unsigned, so Windows SmartScreen shows a one-time warning.

### Option A — Installer (recommended)

1. Double-click `Universe-1.0.0-Setup-x64.exe`.
2. SmartScreen may show *"Windows protected your PC."* Click **More info**,
   then **Run anyway**.
3. The installer opens. Choose an installation folder (or accept the default),
   then click **Install**.
4. When it finishes, Universe is available from the Start menu and an optional
   desktop shortcut.

### Option B — Portable

1. Double-click `Universe-1.0.0-Portable-x64.exe`.
2. Clear the SmartScreen prompt the same way (**More info → Run anyway**).
3. The app runs immediately with no installation. The portable executable can
   be copied to a USB drive and run on any compatible Windows machine.

---

## 6. Installation — Linux

### Option A — AppImage (works on any distribution)

1. Make the file executable:
   ```
   chmod +x Universe-1.0.0-x86_64.AppImage
   ```
2. Run it:
   ```
   ./Universe-1.0.0-x86_64.AppImage
   ```

   If you see an error mentioning **FUSE**, install the FUSE 2 runtime
   (Ubuntu 22.04+ ships without it by default):
   ```
   sudo apt install libfuse2
   ```
   Or run the AppImage with its contents extracted instead:
   ```
   ./Universe-1.0.0-x86_64.AppImage --appimage-extract-and-run
   ```

### Option B — Debian package (Debian / Ubuntu / Mint)

```
sudo apt install ./zl-universe-fe_1.0.0_amd64.deb
```

This installs Universe system-wide and adds it to the applications menu. On
older systems without `apt install` for local files, use:

```
sudo dpkg -i zl-universe-fe_1.0.0_amd64.deb
sudo apt-get install -f      # pulls any missing dependencies
```

After installation, launch **Universe** from the applications menu or by
running `universe` in a terminal.

---

## 7. First launch & onboarding

The first time Universe runs, it walks you through a short setup flow:

1. **Welcome** — an introduction screen. Click **Get Started**.
2. **Mode selection** — choose how you intend to use Universe. Your choice is
   remembered.
3. **Hardware detection** — Universe inspects your machine's CPU, memory, and
   GPU. This is a real probe and takes a couple of seconds. If it fails, a
   **Retry** button is shown.
4. **Recommended models** — based on the detected hardware, Universe suggests
   starter models grouped as small / balanced / large. Select one to continue,
   or click **Skip** to go straight to the Discover catalog.
5. **Setup** — the selected model is prepared and loaded. When setup completes
   you land in **Chat**, ready to start a conversation.

Onboarding runs only once. To see it again, reset the app data (see
[Troubleshooting](#12-troubleshooting)).

---

## 8. The interface

Universe uses a three-region layout:

- **Primary sidebar** (far left) — navigates between the main sections: Chat,
  Discover, My Models, Local Server, Developer Docs, Remote, and Settings.
- **Secondary sidebar** (inner left) — context for the current section, e.g.
  the chat/folder list in Chat, or the model categories in Discover.
- **Content area** (center) — the active screen.
- **Right panel** (collapsible) — contextual details and inference controls;
  toggle it from the header.

The **header** carries the global **model picker** — it shows which model is
currently loaded and lets you switch or eject it from anywhere in the app
(shortcut: ⌘L / Ctrl+L).

---

## 9. Feature walkthrough

### Chat

The core workspace. Type a message and press **Enter** to send (**Shift+Enter**
inserts a newline). While the model is responding you can press **Stop** to
halt generation. Each message supports:

- **Regenerate** — produce a fresh response.
- **Continue** — extend the last response.
- **Branch** — fork the conversation from any message into a new thread.
- **Edit & resend** — change one of your earlier messages and re-run from there.
- **Delete** — remove a message.

The input dock supports **slash commands** and **file attachment**. A context-
usage dial shows how much of the model's context window the conversation is
consuming. If no model is loaded, the input is disabled and a clear call to
action tells you to load one first.

**Organising chats:** the secondary sidebar lets you create folders, rename
them, assign folder colors, drag threads between folders, search threads by
name, and multi-select threads for bulk actions.

**Inference configuration** (right panel): system prompt, sampling parameters
(temperature, top-p, etc.), structured-output schema, stop strings, context-
overflow behavior, per-thread notes, and reusable presets you can save, load,
and delete.

### Discover

A catalog of available models. Search by name, author, description, or tag;
filter by format; sort the results; and browse by category from the secondary
sidebar. Each model page shows download options with a real compatibility tier
computed against your detected hardware. Starting a download runs through an
idle → downloading → completed lifecycle, with Retry/Restart controls if it is
cancelled or fails.

### My Models

Everything you have installed. The table lists each model with pinned items
first. Select a model to Load it, Eject it, or start a new chat with it
directly. The Load tab exposes Context-length and GPU-offload sliders and an
optional source-file override. The Info tab shows the model description. A
footer summarizes total disk usage. Deleting a model asks for confirmation and
auto-ejects it if it is currently loaded.

### Local Server

Simulates running Universe as a local API server. Toggle the server on/off and
watch a progressive boot log. Once running, it exposes a catalog of supported
API endpoints — each endpoint row has a Play button to exercise it — plus a
live vitals card (uptime), a synthetic-traffic runner, and a Restart action.

### Developer Docs

Built-in documentation browser. Navigate via the sidebar tree or clickable
breadcrumb segments. Internal documentation links route within the app. The
search panel filters docs as you type and supports keyboard navigation —
↑/↓ to move between results, **Enter** to open, **Esc** to close.

### Remote

Lets Universe pair with other devices. Remote is **off by default**; when
disabled the screen explains why and offers a one-click control to enable it.
Once enabled, a mock sign-in flow runs, after which simulated peer devices
appear over the next few seconds, each with its own name and model list.

### Settings

Nine panels covering general preferences, appearance (theme), language, server
settings (port and auth), and more. Theme and language changes apply
immediately and persist. Actions that would interrupt an active stream or a
loaded model ask for confirmation first.

---

## 10. Keyboard shortcuts

| Shortcut | Action |
|---|---|
| **Enter** | Send the current chat message |
| **Shift + Enter** | Insert a newline in the chat input |
| **⌘L** / **Ctrl+L** | Open the global model picker |
| **⌘E** / **Ctrl+E** | Edit the system prompt (while focused in the System Prompt editor) |
| **Esc** | Close the Developer Docs search panel |
| **↑ / ↓** | Move between Developer Docs search results |

---

## 11. Data, storage & privacy

- All application data — chats, folders, presets, settings, onboarding state —
  is stored **locally** in the app's data directory using your browser-style
  local storage. Nothing is uploaded.
- Universe makes **no network requests to a language-model provider** and
  downloads no real model weights in this build.
- Hardware detection reads local system information only (CPU, memory, GPU);
  it makes no network calls.
- Application data lives at:
  - **macOS** — `~/Library/Application Support/Universe`
  - **Windows** — `%APPDATA%\Universe`
  - **Linux** — `~/.config/Universe`

Deleting that folder resets Universe to a clean first-run state.

---

## 12. Troubleshooting

**macOS: "Universe is damaged and can't be opened."**
The download-quarantine flag is set. Run
`xattr -dr com.apple.quarantine /Applications/Universe.app` in Terminal, then
launch normally. See [Section 4](#first-launch--clearing-the-gatekeeper-prompt).

**macOS: no "Open" button in the warning dialog.**
You double-clicked instead of right-clicking. Right-click the app → **Open**.

**Windows: "Windows protected your PC."**
This is the SmartScreen warning for an unsigned app. Click **More info → Run
anyway**.

**Linux: AppImage won't start, mentions FUSE.**
Install `libfuse2`, or run with `--appimage-extract-and-run`. See
[Section 6](#option-a--appimage-works-on-any-distribution).

**The window is blank or the app won't open.**
Quit Universe completely, then relaunch. If it persists, reset the app data by
deleting the data directory listed in [Section 11](#11-data-storage--privacy).

**I want to see the onboarding flow again.**
Reset the app data (Section 11) — onboarding runs on the next launch.

**The app feels slow on an Intel Mac running the Apple Silicon build.**
Install the matching build: use the plain `Universe-1.0.0.dmg` on Intel Macs.

---

## 13. Uninstalling

- **macOS** — drag **Universe** from the Applications folder to the Trash.
  Optionally delete `~/Library/Application Support/Universe`.
- **Windows (installer)** — use *Settings → Apps → Installed apps → Universe →
  Uninstall*, or the Start-menu uninstaller.
- **Windows (portable)** — simply delete the `.exe` file.
- **Linux (AppImage)** — delete the `.AppImage` file.
- **Linux (deb)** — `sudo apt remove zl-universe-fe`.

To remove all settings and chats as well, also delete the application data
directory from [Section 11](#11-data-storage--privacy).

---

*Universe 1.0.0 — © 2026 Ziroh Labs Private Limited.*
