# SnapBoard

A minimal kanban‑style companion app for **SnapDock**. SnapBoard lives in your dock, slides out from any screen edge, and provides a lightweight board for notes, files, and quick tasks.

This repository has reached **Alpha** status: the core kanban workflow is complete, including multi‑board support and update delivery. The app is usable on Linux and Windows, but you may encounter minor bugs and occasional state resets as the experience is refined.

---

> [!NOTE]
> SnapBoard is still early in development. Waiting for the Beta milestone is recommended.  
> The visual style represents the direction planned for SnapDock V3.

## Features (Alpha)

- Slide‑out panel animation  
- Dynamic columns (default 7, expandable up to 32)  
- Drag‑and‑drop cards  
- Add, remove, and rename columns and cards (double‑click titles)  
- Multiple boards: create, switch, rename, delete  
- Persistent columns and cards via local storage  
- File cards (stores file paths locally)  
- Note cards (stored in SnapBoard’s local data directory)  
- Custom header text  
- Theme color options  
- Local‑only storage  
- Built‑in updater (same system as SnapDock; currently untested)

---

## Philosophy

SnapBoard is part of the **SnapDock ecosystem** — a set of tools designed to be:

- Minimal  
- Local‑first  
- Offline  
- Fast  
- Beautiful  
- Distraction‑free  

Each component aims to feel lightweight and responsive.

---

## Installation

Download the latest Alpha build from the **Releases → Alpha** section.

Supported platforms:

- **Linux** (`.deb`, AppImage)  
- **Windows** (`.exe` coming soon)  
- **macOS** (coming soon; contributions welcome)

---

## Development

### Project Structure

Most core logic is located in `src/modules`:

- `file/` — board persistence, recent boards, autosave  
- `markdown.js` — note card editing and rendering helpers  
- `ui/` — UI building blocks (theme, editor state, resize, help, etc.)  
- `updater.js` — entry points for the update system

### Running in Development

```bash
npm install
npm run dev
```

### Linux Packaging (Local Testing)

To build and install the `.deb` package locally:

```bash
rm -rf dist/ \
  && npm run build \
  && sudo dpkg -i dist/snapboard_1.0.0_amd64.deb \
  && hash -r \
  && snapboard
```

_Built on Linux first._

---

## License

See `LICENSE` for details.

---