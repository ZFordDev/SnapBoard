# SnapBoard

SnapBoard is a lightweight local-first kanban board built for the SnapDock ecosystem.

The project focuses on fast task organization, markdown-based cards, file attachment support, and a clean desktop workflow without cloud dependencies or unnecessary complexity.

SnapBoard is currently in **Alpha** and under active development.  
The core board system is now functional, including markdown editing, file attachments, drag-and-drop cards, and persistent JSON storage.

The original “slide-out dock panel” concept is still part of the long-term vision, but current development is focused on building a stable and portable core experience first.

---

> [!WARNING]
> SnapBoard is functional but **not yet security hardened**.
>
> File paths, markdown content, and board data are currently stored locally without sandboxing or validation.
>
> Security layers, validation, and workspace protections will be added before the first Beta release.

---

## ✨ Current Features

### ✔ Core Board System
- Multiple boards
- Dynamic columns (default 7, expandable up to 32)
- Drag-and-drop cards
- Persistent JSON-based storage
- Local-first workflow
- Clean UI and logic separation

### ✔ Card System
- Markdown card editing
- Live markdown preview
- Editor modal
- File drag-and-drop attachments
- Automatic persistence
- Legacy card migration support

### ⚠ Current Limitations
- No markdown sanitization yet
- No workspace isolation
- No file permission restrictions
- Absolute file paths are stored directly
- Security hardening still in progress

These limitations are known and expected during Alpha development.

---

## 💡 Philosophy

SnapBoard is part of the broader **SnapDock ecosystem** — a collection of lightweight desktop tools designed to feel fast, local, and distraction-free.

The goal is not to build a massive productivity suite.

Instead, SnapDock tools aim to provide:
- lightweight workflows
- fast interaction
- local-first storage
- clean desktop integration
- minimal friction

SnapBoard follows the same philosophy:
simple boards, fast interaction, and a UI that stays out of the way.

---

## 📦 Installation

Download the latest Alpha release from the Releases page.

### Supported Platforms
- Windows
- Linux (`.deb`, AppImage)

### Planned
- macOS support
- broader desktop integration
- optional SnapDock integration features

---

## 🛠 Development

### Running in Development

```bash
npm install
npm run dev
````

### Linux Packaging Example

```bash
rm -rf dist/ \
  && npm run build \
  && sudo dpkg -i dist/snapboard_${version}_amd64.deb \
  && hash -r \
  && snapboard
```

---

## 🧭 Roadmap

### 🔜 Beta Goals

* Security hardening
* Markdown sanitization
* Stable editor experience
* Improved drag-and-drop behavior
* Better column management
* UI polish and animation cleanup

### Future Direction

* Tags and filtering
* Search support
* Multi-file attachments
* Board templates
* Optional SnapDock integration improvements
* Re-evaluating slide-out desktop panel support

---

## 👥 Contributing

SnapBoard is still evolving rapidly and community contributions are welcome.

Good areas to contribute:

* UI/UX improvements
* drag-and-drop polish
* markdown rendering
* accessibility
* Linux packaging/testing
* board organization features
* animation cleanup

Issues tagged:

* `good first issue`
* `UI/UX`
* `help wanted`

…are especially beginner-friendly.

---

## 📄 License

See `LICENSE` for details.

