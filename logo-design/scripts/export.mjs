#!/usr/bin/env node
// Export SVG logos to transparent PNGs at given sizes (longest side, aspect ratio kept).
//
// Usage: node export.mjs logo.svg [more.svg ...] [--sizes 512,1024] [--out png/] [--bg #ffffff]
// Requires Playwright with Chromium.

import { readFile, mkdir } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function parseArgs(argv) {
  const args = { files: [], out: "png", sizes: [512, 1024], bg: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") args.out = argv[++i];
    else if (a === "--sizes") args.sizes = argv[++i].split(",").map(Number).filter(Boolean);
    else if (a === "--bg") args.bg = argv[++i];
    else if (a === "-h" || a === "--help") {
      console.log("Usage: node export.mjs logo.svg [...] [--sizes 512,1024] [--out dir] [--bg color]");
      process.exit(0);
    } else args.files.push(a);
  }
  if (!args.files.length) {
    console.error("No SVG files given. See --help.");
    process.exit(1);
  }
  return args;
}

// Read the aspect ratio from the viewBox (falls back to width/height, then square).
function aspectRatio(svg) {
  const vb = svg.match(/viewBox\s*=\s*["']\s*([-\d.eE]+)[\s,]+([-\d.eE]+)[\s,]+([-\d.eE]+)[\s,]+([-\d.eE]+)/);
  if (vb) return Number(vb[3]) / Number(vb[4]);
  const w = svg.match(/<svg[^>]*\swidth\s*=\s*["']([\d.]+)/);
  const h = svg.match(/<svg[^>]*\sheight\s*=\s*["']([\d.]+)/);
  if (w && h) return Number(w[1]) / Number(h[1]);
  return 1;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch {
    console.error("Playwright is not installed. Run: npm i playwright && npx playwright install chromium");
    process.exit(1);
  }
  await mkdir(args.out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });

  for (const file of args.files) {
    const svg = await readFile(file, "utf8");
    const name = basename(file, extname(file));
    const ratio = aspectRatio(svg);
    const url = "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");

    for (const size of args.sizes) {
      const width = Math.round(ratio >= 1 ? size : size * ratio);
      const height = Math.round(ratio >= 1 ? size / ratio : size);
      await page.setViewportSize({ width, height });
      await page.setContent(
        `<!doctype html><html><head><style>html,body{margin:0;background:${args.bg ?? "transparent"}}
         img{display:block;width:${width}px;height:${height}px}</style></head>
         <body><img src="${url}"></body></html>`,
        { waitUntil: "load" }
      );
      const out = join(args.out, `${name}-${size}.png`);
      await page.screenshot({
        path: out,
        omitBackground: !args.bg,
        clip: { x: 0, y: 0, width, height },
      });
      console.log(out);
    }
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
