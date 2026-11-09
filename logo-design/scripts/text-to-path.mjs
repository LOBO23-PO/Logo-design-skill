#!/usr/bin/env node
// Convert a line of text into an SVG <path> using a local font file (TTF/OTF/WOFF),
// so final wordmarks don't depend on fonts installed on the viewer's machine.
//
// Usage:
//   node text-to-path.mjs --font Font.ttf --text "Brand" [--size 100] [--tracking 0.05]
//                         [--fill #16161a] [--out wordmark.svg]
//
// --tracking is letter-spacing as a fraction of font size (0.05 = +5 %).
// Without --out, prints a standalone SVG to stdout.
// Requires opentype.js: npm i opentype.js
// Open-licensed fonts (SIL OFL) can be downloaded from https://github.com/google/fonts

import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function parseArgs(argv) {
  const a = { size: 100, tracking: 0, fill: "#16161a" };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    if (k === "--font") (a.font = v), i++;
    else if (k === "--text") (a.text = v), i++;
    else if (k === "--size") (a.size = Number(v)), i++;
    else if (k === "--tracking") (a.tracking = Number(v)), i++;
    else if (k === "--fill") (a.fill = v), i++;
    else if (k === "--out") (a.out = v), i++;
    else if (k === "-h" || k === "--help") {
      console.log(
        'Usage: node text-to-path.mjs --font Font.ttf --text "Brand" [--size 100] [--tracking 0.05] [--fill #000] [--out file.svg]'
      );
      process.exit(0);
    }
  }
  if (!a.font || !a.text) {
    console.error("--font and --text are required. See --help.");
    process.exit(1);
  }
  return a;
}

const r = (n) => Math.round(n * 100) / 100;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let opentype;
  try {
    opentype = require("opentype.js");
  } catch {
    console.error("opentype.js is not installed. Run: npm i opentype.js");
    process.exit(1);
  }
  const buf = await readFile(args.font);
  const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  const scale = args.size / font.unitsPerEm;
  const tracking = args.tracking * args.size;

  // Lay out glyphs manually so tracking and kerning both apply.
  const glyphs = font.stringToGlyphs(args.text);
  const full = new opentype.Path();
  let x = 0;
  glyphs.forEach((g, i) => {
    full.extend(g.getPath(x, 0, args.size));
    x += g.advanceWidth * scale;
    if (i < glyphs.length - 1) {
      x += font.getKerningValue(g, glyphs[i + 1]) * scale + tracking;
    }
  });
  const d = full.toPathData(2);

  // Tight bounding box from the combined path.
  const bb = full.getBoundingBox();
  const pad = args.size * 0.05;
  const vb = [bb.x1 - pad, bb.y1 - pad, bb.x2 - bb.x1 + 2 * pad, bb.y2 - bb.y1 + 2 * pad].map(r);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(" ")}">
  <title>${args.text.replace(/[<&]/g, "")}</title>
  <path fill="${args.fill}" d="${d}"/>
</svg>
`;
  if (args.out) {
    await writeFile(args.out, svg);
    console.log(`Wrote ${args.out} (viewBox ${vb.join(" ")})`);
  } else {
    process.stdout.write(svg);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
