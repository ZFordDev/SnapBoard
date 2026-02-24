# SnapBoard

A minimal, local‑first kanban board designed as a companion to **SnapDock**.  
SnapBoard uses a dock‑based frameless UI with a glass panel that slides out from any screen edge.

Built for speed, clarity, and everyday workflow.

> [!NOTE]
> SnapBoard is currently in active development.  
> It is not ready for general use and should be considered **experimental**.

---

## ✨ Features (Planned & In Progress)

- Frameless dock with draggable region  
- Glass‑panel board with smooth slide‑out animation  
- Dynamic columns (default 7, expandable up to 32)  
- Drag‑and‑drop cards  
- File cards (stores file paths locally)  
- Note cards (stored in SnapBoard’s local data directory)  
- Custom header text  
- Theme color options  
- Local‑only storage  
- Built‑in updater (GitHub Releases)

---

## 🧩 Philosophy

SnapBoard is part of the **SnapDock ecosystem** — a family of tools built to be:

- minimal  
- local‑first  
- offline  
- fast  
- beautiful  
- distraction‑free  

Every component is designed to feel lightweight, responsive, and intentional.

---

## 📦 Installation

Download the latest release from the **Releases** page.

Available for:

- **Linux** (`.deb`, AppImage)  
- **Windows**  
- **macOS** (coming soon)

---

## 🛠 Development

```bash
npm install
npm run dev
```

Tailwind v4 is preconfigured using the standalone binary located in `assets/tailwind/`.

### Linux packaging (local testing)

To build and install the `.deb` package locally:

```bash
rm -rf dist/ \
  && npm run build \
  && sudo dpkg -i dist/snapboard_1.0.0_amd64.deb \
  && hash -r \
  && snapboard
```

---

## 📄 License

See `LICENSE` for details.

---
