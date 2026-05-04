# SnapBoard

A minimal, local‑first kanban companion for **SnapDock**.  
SnapBoard lives in your dock, slides out from any screen edge, and gives you a lightweight board for notes, files, and quick tasks.

SnapBoard is currently in **Alpha**.  
The new card system (markdown editing, file attachments, JSON persistence) is now live, but still early and not yet security‑hardened. Expect rapid iteration as we move toward the first Beta milestone.

---

> [!WARNING]
> SnapBoard is functional but **not yet secure**.  
> File paths, markdown content, and board data are stored locally without sandboxing or validation.  
> Hardening and safety layers will be added before the Beta release.

---

> [!NOTE]
> v0.2.4 introduces the new card architecture:
> - Markdown editing + preview  
> - File drag‑and‑drop (stores absolute paths)  
> - New editor modal  
> - JSON persistence with migration  
> - Clean UI/logic separation  
>
> This is the foundation for the upcoming Beta UI and SnapDock integration.

---

## Features (Alpha)

### ✔ Core
- Slide‑out panel UI  
- Dynamic columns (default 7, up to 32)  
- Drag‑and‑drop cards  
- Multiple boards (create, switch, rename, delete)  
- Persistent state (JSON‑based session storage)  

### ✔ New in v0.2.4
- Markdown card editor  
- Live preview mode  
- File attachment via drag‑and‑drop  
- New card data model  
- Debounced JSON persistence  
- Migration for older card formats  

### ⚠ Early / Not Yet Hardened
- No file‑path sandboxing  
- No markdown sanitization  
- No permission model  
- No secure workspace isolation  

These will be addressed before Beta.

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

Download the latest **Alpha** build from the Releases page.

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
  && sudo dpkg -i dist/snapboard_${version}_amd64.deb \
  && hash -r \
  && snapboard
```

---

## Roadmap

### 🔜 Beta Milestone
- Security hardening (file paths, markdown sanitization)  
- Stable card editor  
- Column improvements  
- SnapDock workspace export  
- UI polish + animations  

### Future
- Multi‑file attachments  
- Tags + search  
- Board templates  
- SnapDock V3 integration  

---

## License

See `LICENSE` for details.
