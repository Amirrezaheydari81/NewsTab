const fs = require("fs");
const path = require("path");
const { minify } = require("terser");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");

function cleanDist() {
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true });
  }
  fs.mkdirSync(DIST, { recursive: true });
}

function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
}

async function minifyJs() {
  const files = ["app.js", "quotes.js", "tgju-v2.js"];
  for (const file of files) {
    const input = path.join(ROOT, file);
    const output = path.join(DIST, file);
    if (!fs.existsSync(input)) continue;
    const code = fs.readFileSync(input, "utf8");
    try {
      const result = await minify(code, { compress: true, mangle: true });
      fs.writeFileSync(output, result.code);
      console.log(`Minified: ${output}`);
    } catch (err) {
      console.error(`Minification failed for ${file}:`, err);
      process.exit(1);
    }
  }
}

function copyAssets() {
  const assets = [
    "newtab.html",
    "style.css",
    "manifest.json",
    "logo.png",
    "quotes.js",
    "tgju-v2.js",
  ];

  assets.forEach((file) => {
    const src = path.join(ROOT, file);
    const dest = path.join(DIST, file);
    if (fs.existsSync(src)) {
      copyFile(src, dest);
      console.log(`Copied: ${dest}`);
    }
  });

  const fontsDir = path.join(ROOT, "fonts");
  if (fs.existsSync(fontsDir)) {
    fs.cpSync(fontsDir, path.join(DIST, "fonts"), { recursive: true });
    console.log(`Copied: fonts/`);
  }
}

async function build() {
  console.log("Building production bundle...");
  cleanDist();
  await minifyJs();
  copyAssets();
  console.log("Build complete.");
}

build();
