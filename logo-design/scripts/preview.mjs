#!/usr/bin/env node
// Render SVG logos at several sizes on light, mid and dark backgrounds,
// writing individual PNGs and a contact sheet per logo.
//
// Usage: node preview.mjs logo.svg [more.svg ...] [--out previews/] [--sizes 16,32,64,128,512]
// Requires Playwright with Chromium (`npm i playwright` then `npx playwright install chromium`
// if not already available).

import { readFile, mkdir } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function loadPlaywright() {
  try {
    return require("playwright");
  } catch {
    console.error(
      "Playwright is not installed. Run: npm i playwright && npx playwright install chromium"
    );
    process.exit(1);
  }
}

function parseArgs(argv) {
  const args = { files: [], out: "previews", sizes: [16, 32, 64, 128, 512] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") args.out = argv[++i];
    else if (a === "--sizes") args.sizes = argv[++i].split(",").map(Number).filter(Boolean);
    else if (a === "-h" || a === "--help") {
      console.log("Usage: node preview.mjs logo.svg [...] [--out dir] [--sizes 16,32,64]");
      process.exit(0);
    } else args.files.push(a);
  }
  if (!args.files.length) {
    console.error("No SVG files given. See --help.");
    process.exit(1);
  }
  return args;
}

const BACKGROUNDS = [
  { name: "light", color: "#ffffff", label: "#16161a" },
  { name: "mid", color: "#8a8f98", label: "#ffffff" },
  { name: "dark", color: "#111114", label: "#e8e8ec" },
];

function svgDataUrl(svg) {
  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}

function sheetHtml(name, svg, sizes) {
  const url = svgDataUrl(svg);
  const rows = BACKGROUNDS.map(
    (bg) => `
    <div class="row" style="background:${bg.color};color:${bg.label}">
      ${sizes
        .map(
          (s) => `<figure><div class="box" style="width:${s}px;height:${s}px">
            <img src="${url}" style="max-width:${s}px;max-height:${s}px"></div>
            <figcaption>${s}px</figcaption></figure>`
        )
        .join("")}
    </div>`
  ).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;font:12px/1.4 system-ui,sans-serif;background:#fff}
    h1{font-size:14px;margin:0;padding:12px 16px;background:#f3f3f5;color:#16161a}
    .row{display:flex;align-items:flex-end;gap:28px;padding:24px 16px}
    figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:6px}
    .box{display:flex;align-items:center;justify-content:center}
    img{display:block;width:100%;height:100%;object-fit:contain}
    figcaption{opacity:.7}
  </style></head><body><h1>${name}</h1>${rows}</body></html>`;
}

function singleHtml(svg, size, bg) {
  return `<!doctype html><html><head><style>
    html,body{margin:0;background:${bg}}
    img{display:block;width:${size}px;height:${size}px;object-fit:contain}
  </style></head><body><img src="${svgDataUrl(svg)}"></body></html>`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { chromium } = loadPlaywright();
  await mkdir(args.out, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });

  for (const file of args.files) {
    const svg = await readFile(file, "utf8");
    if (!/<svg[\s>]/i.test(svg)) {
      console.warn(`Skipping ${file}: not an SVG`);
      continue;
    }
    const name = basename(file, extname(file));

    for (const bg of BACKGROUNDS) {
      for (const size of args.sizes) {
        await page.setViewportSize({ width: size, height: size });
        await page.setContent(singleHtml(svg, size, bg.color), { waitUntil: "load" });
        const out = join(args.out, `${name}-${bg.name}-${size}.png`);
        await page.screenshot({ path: out, clip: { x: 0, y: 0, width: size, height: size } });
      }
    }

    await page.setViewportSize({ width: 1100, height: 400 });
    await page.setContent(sheetHtml(name, svg, args.sizes), { waitUntil: "load" });
    const sheet = join(args.out, `${name}-sheet.png`);
    await page.screenshot({ path: sheet, fullPage: true });
    console.log(`${file} -> ${resolve(sheet)}`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
