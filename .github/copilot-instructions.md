## Purpose

Provide quick, actionable guidance for AI coding agents working on this repository.

## Repo Snapshot

- Single-page static site. Primary file: `index.html` at the repo root.
- No build system, package manifests, or tests detected.

## Big Picture / Architecture

- The project is a minimal static HTML/CSS/JS demo that renders a 5x5 pixel logo.
- Styling is inline inside `index.html` using CSS variables in `:root` for easy tuning (e.g. `--pixel-size`, `--color-pixel`).
- The pixel grid is implemented with a `.grid` container and repeated `.pixel` elements; active pixels have the additional class `.pixel.on`.
- Interactive behavior is minimal and inline: the element with id `logoArea` toggles `auto-glitch` via `triggerRandomGlitch()` and handles click-to-replay animations.

## Key Files / Symbols

- `index.html` — single source of truth for markup, styles, and small JS.
- CSS variables to change at-a-glance:
  - `--pixel-size` — scale the whole logo.
  - `--color-pixel`, `--color-glitch-1`, `--color-glitch-2` — colors for normal and glitch states.
- DOM hooks:
  - Container id: `logoArea` (used by JS to add/remove `auto-glitch`).
  - Pixel nodes: elements with class `pixel` and active state `pixel on`.
- JS functions of interest:
  - `triggerRandomGlitch()` — periodic glitch trigger.

## Developer Workflows (practical)

- Quick local preview (macOS):
  - Double-click/open: `open index.html`
  - Or run a simple HTTP server and open browser:
    - `python3 -m http.server 8000` then open `http://localhost:8000`
  - Using an editor extension (e.g., Live Server) is also fine.

## Editing Patterns & Conventions (project-specific)

- Prefer minimal, focused edits to `index.html`. Because everything is inline, small changes are easiest and lowest-risk.
- Visual tuning examples:
  - Resize the logo: edit `--pixel-size` in the `:root` style block.
  - Change the logo color: edit `--color-pixel`.
  - Add/remove pixels: toggle the `on` class on `.pixel` elements to change the logo shape.
- If extracting CSS/JS to separate files (only do this for larger refactors), keep the same class/id names and update `index.html` to reference the new files. Add `assets/css/` and `assets/js/` directories for organization.

## PR Guidance

- Keep PRs small and focused (single visual or behavioral change per PR).
- Include a screenshot or short GIF for any visual change to speed review.
- Preserve `lang="zh-CN"` in `<html>` unless there's a clear reason to change it.

## What NOT to assume

- There are no automated tests or CI steps to run here—do not add assumptions about tooling not present in the repo unless you add them and document the change.

## If you find an existing agent doc

- If `.github/copilot-instructions.md` already exists when you run, merge rather than overwrite: preserve any project-context sections and append or update the specific areas above (workflows, key symbols, examples).

## Examples (concrete edits)

- Change pixel size (small example): modify this line in `index.html`:

  - `--pixel-size: 40px;` → `--pixel-size: 32px;`

- Toggle an individual pixel on/off:

  - Find a `<div class="pixel on"></div>` and remove `on` to turn it off.

- Re-trigger entrance animation via click handler:

  - The `logoArea` click listener resets per-pixel animations; emulate by calling the same logic if you move JS to separate file.

---
If anything here is unclear or you want extra examples (e.g., how to extract CSS/JS into `assets/`), tell me which area to expand.
