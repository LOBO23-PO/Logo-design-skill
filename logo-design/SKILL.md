---
name: logo-design
description: Design original logos, wordmarks, monograms and brand marks as clean, scalable SVG. Use whenever the user asks for a logo, brand mark, emblem, icon for a business or product, favicon, wordmark, monogram, or a visual identity starter kit — including requests to redesign, simplify, or produce variations of an existing logo they own. Produces several distinct concepts, refines the chosen one, and delivers SVG files plus PNG previews at multiple sizes on light and dark backgrounds.
---

# Logo Design

Design logos the way a professional identity designer would: understand the brand first, explore genuinely different concepts, then refine one into a production-ready, scalable mark. Output is hand-written SVG, which is precise, editable and resolution-independent.

## Ground rules

- **Originality.** Never reproduce, trace or closely imitate a real company's logo, mascot or trademark, even if asked to "make it look like X". You may borrow a *general style* (e.g. "flat geometric like modern tech brands") but the mark itself must be new. If the user supplies their own existing logo, you may refine or redraw it.
- **Vector first.** Every mark is SVG built from simple geometry (`rect`, `circle`, `path`, `polygon`). No embedded raster images, no filters or blur for the core mark, no external fonts in the final deliverable (see Typography).
- **Works in one color.** A logo that only works with gradients is not finished. Always verify a single-color version.
- **Works small.** Check the mark at 16 px and 32 px. If it turns to mush, simplify.

## Workflow

### 1. Brief (ask only what you can't infer)

Collect, from the conversation or with a short question set:

| Item | Why it matters |
|---|---|
| Name (exact spelling, casing) and tagline if any | Drives wordmark and lockups |
| What the business does, for whom | Concept source |
| 3 personality adjectives (e.g. *warm, artisanal, trustworthy*) | Drives shape language, type, color |
| Preferred / forbidden colors | Constraints |
| Where it will be used (signage, app icon, packaging, social avatar, embroidery) | Drives level of detail |
| Logo type preference, if any (see below) | Narrows exploration |
| Logos they like or dislike, and why | Taste calibration (do not copy them) |

If the user gives little, make reasonable assumptions, state them in one or two lines, and proceed. Don't block on a questionnaire.

### 2. Concept exploration (3–4 concepts)

Produce 3–4 concepts that are **meaningfully different**, not color swaps. Vary across these axes:

- **Logo type**: wordmark, lettermark/monogram, pictorial mark, abstract mark, emblem/badge, combination mark (symbol + wordmark).
- **Idea**: literal (what they make), metaphorical (what they stand for), typographic (play on letterforms), negative-space trick.
- **Shape language**: geometric vs. organic, rounded vs. sharp, heavy vs. light.

For each concept, write one sentence of rationale: the idea and why it fits the brief. See `references/concepts.md` for idea-generation techniques.

Present the concepts side by side (an HTML page or a single composite SVG) so the user can compare them, then ask which direction to develop. If the user asked for a single finished logo and no options, pick the strongest concept yourself and say why.

### 3. Refinement

On the chosen concept:

1. **Construct on a grid.** Use a viewBox like `0 0 512 512` for symbols; align key points to whole numbers or a consistent module (e.g. multiples of 8 or 16).
2. **Optical corrections.** Circles and points overshoot flat edges slightly (≈1–3 %) to look the same size; horizontal strokes look thicker than vertical ones of equal width, so thin them a little.
3. **Simplify.** Remove every element that doesn't survive at 32 px or that doesn't carry the idea.
4. **Balance the lockup.** Symbol height typically ≈ cap height × 1.5–2.5 for horizontal lockups; gap between symbol and wordmark ≈ 0.5–1× the width of a key letter stroke cluster. Center optically, not mathematically.
5. **Color.** Start in black. Add color only once the form works. See `references/color-and-type.md`.

### 4. Validate

Run the preview script, then **look at the PNGs** (use the Read tool on the images) and fix what you see:

```bash
node <skill-dir>/scripts/preview.mjs path/to/logo.svg [more.svg ...] --out previews/
```

It renders each SVG at 16, 32, 64, 128 and 512 px on white, black and a mid-tone background, plus a contact sheet `previews/<name>-sheet.png`. Check:

- [ ] Legible and recognisable at 16 px and 32 px
- [ ] Works on light and dark backgrounds (provide a reversed version if needed)
- [ ] One-color version holds up
- [ ] No accidental shapes or unwanted readings (rotate it, squint at it)
- [ ] Doesn't resemble a well-known existing logo
- [ ] Text spelled exactly as given

### 5. Deliver

Produce a small, well-named kit (adapt to what was asked):

```
<brand>-logo/
  <brand>-primary.svg            # full-color combination mark / main lockup
  <brand>-horizontal.svg         # symbol left, wordmark right
  <brand>-stacked.svg            # symbol above wordmark
  <brand>-symbol.svg             # symbol only (avatars, app icon)
  <brand>-wordmark.svg           # name only
  <brand>-mono-black.svg
  <brand>-mono-white.svg
  <brand>-favicon.svg            # simplified symbol, square viewBox
  png/                           # exports from preview.mjs (e.g. 512, 1024)
  brand-sheet.html               # one page: marks, clear space, colors (hex/RGB/CMYK approx), type
```

`scripts/export.mjs` renders any SVG to PNG at chosen sizes:

```bash
node <skill-dir>/scripts/export.mjs logo.svg --sizes 512,1024 --out png/
```

End with a short note: the concept rationale, the palette with hex values, the typeface used, and recommended clear space and minimum size.

## SVG authoring rules

- Root element: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="…">` with **no** fixed `width`/`height` in the master file (add them only for exports that need them).
- Include `<title>` with the brand name for accessibility.
- Use `fill` on shapes; avoid strokes in final files where possible (convert strokes to filled outlines mentally by drawing the outline path), because strokes scale unpredictably in some tools. Strokes are fine during exploration.
- Keep IDs unique and prefixed (`acme-grad-1`) so several logos can be inlined on one page.
- Define colors once: put brand colors in a `<style>` with classes, or repeat exact hex values. No `currentColor` in the primary file; do use `currentColor` in a separate icon variant if the user wants theme-able icons.
- Coordinates rounded to at most 2 decimals.
- No `<image>`, no `<foreignObject>`, no scripts.

## Typography

Text in an SVG depends on the viewer having the font, so:

- **Exploration**: `<text>` with a robust font stack is fine (`font-family="Inter, Helvetica, Arial, sans-serif"`), and you may load Google Fonts in an HTML comparison page.
- **Final wordmark**: prefer drawing the letters as paths (custom lettering suits logos anyway), or convert text to outlines if a tool is available (e.g. `fonttools`/`opentype.js` — see `scripts/text-to-path.mjs`). If neither is possible, keep `<text>` but name the exact font and license in the delivery note and ship it with an open-licensed font (SIL OFL fonts from Google Fonts are safe defaults).
- Adjust letter-spacing (tracking) by eye; wordmarks in all caps usually need +2 % to +10 % tracking, lowercase usually 0 to −2 %. Kern awkward pairs (AV, To, LT, ry).

## Common failure modes to avoid

- Concepts that are the same idea in four colors.
- Clip-art literalism (a coffee cup for a café, a house for a realtor) with no twist. If you go literal, find an unexpected angle or a clever negative space.
- Too many details, gradients, drop shadows or thin hairlines.
- Text that is too small inside an emblem to read at real sizes.
- Trendy effects that date quickly unless the user asks for them.
- Imbalance: a heavy symbol next to a spindly wordmark (or vice versa). Match stroke weights.

## References

- `references/concepts.md` — idea-generation techniques and logo-type guide
- `references/color-and-type.md` — color psychology, palette building, contrast, type pairing
- `examples/` — sample SVGs showing structure and conventions (fictional brands)
