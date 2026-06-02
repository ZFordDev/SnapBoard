<!-- ========================================================= -->
<!-- Standards Approval Badge -->
<!-- ========================================================= -->
<table align="right">
  <tr>
    <td>
      <img src="https://raw.githubusercontent.com/ZFordDev/ZFordDev/main/assets/standards-approved.svg" width="80" alt="ZFordDev Standards Approved Badge">
    </td>
  </tr>
</table>

# Contributing to ZFordDev Projects

Thank you for your interest in contributing!  
All ZFordDev projects follow a shared set of standards designed to keep the ecosystem consistent, maintainable, and welcoming.

This document explains how to contribute code, documentation, bug reports, and feature requests across the ecosystem.

For ecosystem‑wide expectations, please read:

👉 [**STANDARDS.md**](https://github.com/ZFordDev/ZFordDev/blob/main/STANDARDS.md)  
(Clarity • Simplicity • Maintainability • Long‑term stability)

---

## Ways to Contribute

You can contribute in many ways:

- Reporting bugs  
- Suggesting new features  
- Improving documentation  
- Submitting pull requests  
- Reviewing existing issues  
- Helping refine UX or workflows  
- Testing on different platforms  

All contributions are appreciated — even small ones.

---

## Code of Conduct

By participating in this project, you agree to follow:

👉 [**CODE_OF_CONDUCT.md**](CODE_OF_CONDUCT.md)

Respect, clarity, and constructive collaboration are core values of the ecosystem.

---

## Before You Start

Please check:

- The **Issues** tab for existing reports  
- The **Roadmap** (if present)  
- The **Discussions** tab for ongoing ideas  
- The **STANDARDS.md** file for ecosystem rules  
- The **project‑specific section** below for details unique to this repository

If you’re unsure whether an idea fits, open a Discussion first — it saves everyone time.

---

## Pull Request Guidelines

To keep contributions consistent:

1. **Fork the repository**  
2. **Create a feature branch**  
   - `feature/your-feature-name`  
   - `fix/your-bug-name`
3. **Keep PRs focused**  
   - One feature or fix per PR  
   - Avoid unrelated formatting changes
4. **Follow the coding style of the project**  
   - Naming conventions  
   - File structure  
   - Module layout  
5. **Test your changes**  
   - Ensure the app builds  
   - Ensure no regressions  
6. **Write clear commit messages**  
   - Present tense  
   - Short and descriptive  
7. **Describe your PR clearly**  
   - What changed  
   - Why it changed  
   - Any side effects or considerations

Small, focused PRs are easier to review and merge.

---

## Reporting Bugs

When reporting a bug, please include:

- OS and version  
- App version  
- Steps to reproduce  
- Expected behavior  
- Actual behavior  
- Screenshots or logs (if helpful)

Clear reports help us fix issues faster.

---

## Suggesting Features

Feature requests should:

- Explain the problem, not just the solution  
- Describe the use case  
- Fit the project’s philosophy (see STANDARDS.md)  
- Avoid scope creep or IDE‑level complexity  

If unsure, open a Discussion first.

---

## Project‑Specific Guidelines

Each project may have additional rules, workflows, or architectural notes.

### SnapBoard‑Specific Notes

- UI changes should follow the existing layout and column structure  
- Markdown rendering changes must not break CoffeeMD compatibility (once integrated)  
- Drag‑and‑drop logic must remain stable across all supported platforms  
- Card editor updates must preserve markdown compatibility and live preview behaviour  
- Avoid introducing heavy dependencies — SnapBoard must remain lightweight and local‑first  
- State changes should follow the existing structure in `src/state/`  
- Interaction logic should remain consistent with the patterns in `src/interactions/`  
- Electron updates should be tested on both Windows and Linux when possible  
- Storage changes must maintain backward compatibility with existing board JSON files  

---

## Thank You

Your contributions help strengthen the entire ZFordDev ecosystem.  
Whether you’re fixing a typo or building a major feature — you’re part of the project’s future.

