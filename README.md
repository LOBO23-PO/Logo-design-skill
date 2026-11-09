# Logo-design-skill

A Claude skill for designing original logos as clean, scalable SVG, plus logos made with it.

## Skill: `logo-design/`

| Path | Purpose |
|---|---|
| `SKILL.md` | Workflow: brief → 3–4 concepts → refinement → validation → delivery kit |
| `references/concepts.md` | Logo types, idea-generation techniques, shape language |
| `references/color-and-type.md` | Palette building, contrast checks, open-licensed type pairings |
| `scripts/preview.mjs` | Renders SVGs at 16–512 px on light/mid/dark backgrounds + contact sheet |
| `scripts/export.mjs` | Exports SVGs to (transparent) PNGs at chosen sizes |
| `scripts/text-to-path.mjs` | Converts a wordmark to outlined SVG paths (needs `opentype.js`) |
| `examples/` | Sample marks for a fictional brand |

Install: copy `logo-design/` into `~/.claude/skills/` (or a project's `.claude/skills/`).
Scripts need Node 18+ and Playwright with Chromium; `text-to-path.mjs` also needs `npm i opentype.js`.

## Logos: `logos/`

### DOÇÃO (`logos/docao/`)

Azulejo-style cartouche in cobalt blue on glazed white, with baroque scrolls,
corner rosettes and the name set in Marcellus (SIL OFL), converted to outlines.

| File | Use |
|---|---|
| `docao-primary.svg` | Main logo: blue on cream |
| `docao-mono-blue.svg` | Blue on white |
| `docao-mono-black.svg` | One-color black (stamps, invoices, engraving) |
| `docao-reversed.svg` | Cream on a blue background |
| `docao-favicon.svg` | Square "D" tile for favicon / social avatar |
| `png/` | PNG exports (1200 px; primary also 2400 px) |
| `build.py` | Regenerates every SVG: `python3 build.py Marcellus-Regular.ttf` |

Colors: cobalt `#1d3f9e`, glazed white `#f7f3ea`.
