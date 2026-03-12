# SnapBoard

A minimal, local‑first kanban companion for **SnapDock**.  
SnapBoard lives in your dock, slides out from any screen edge, and gives you a lightweight board for notes, files, and quick tasks.

This repository is currently in **Alpha**. The core kanban workflow is functional — multi‑board support, drag‑and‑drop, persistent state, and the update system are all in place — but the experience is still evolving. Expect rough edges and rapid iteration.

---

> [!WARNING]
> The current main branch is **in flux**.  
> Card creation and editing are temporarily disabled while the new card module is being redesigned.  
> For the closest working version, please check the **Releases** section.

---


> [!NOTE]
> SnapBoard is early in development. A Beta milestone will bring a stable UI, card editor, and full SnapDock integration.  
> The visual style reflects the direction planned for SnapDock V3.

---

## Features (Alpha)

- Slide‑out panel UI  
- Dynamic columns (default 7, expandable up to 32)  
- Drag‑and‑drop cards  
- Add, remove, rename columns and cards  
- Multiple boards (create, switch, rename, delete)  
- Persistent state via local storage  
- File cards (stores file paths locally)  
- Note cards (stored in SnapBoard’s data directory)  
- Custom header text  
- Theme color options  
- Local‑only storage  
- Built‑in updater (shared with SnapDock; currently untested)

---

## Philosophy

SnapBoard is part of the **SnapDock ecosystem** — tools designed to be:

- Minimal  
- Local‑first  
- Offline  
- Fast  
- Beautiful  
- Distraction‑free  

Every component aims to feel lightweight, responsive, and intentional.

---

## Installation

Download the latest Alpha build from the **Releases** page.

Supported platforms:

- **Windows**  
- **Linux** (`.deb`, AppImage)  
- **macOS** (planned; contributions welcome)

---

## Development

### Running in Development

```bash
npm install
npm run dev
```

### Packaging (Linux example)

```bash
rm -rf dist/ \
  && npm run build \
  && sudo dpkg -i dist/snapboard_1.0.0_amd64.deb \
  && hash -r \
  && snapboard
```

---

## License

See `LICENSE` for details.

---
