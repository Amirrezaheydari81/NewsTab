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

function minifyJs() {
  const input = path.join(ROOT, "app.js");
  const output = path.join(DIST, "app.js");
  const code = fs.readFileSync(input, "utf8");

  minify(code, { compress: true, mangle: true })
    .then((result) => {
      fs.writeFileSync(output, result.code);
      console.log(`Minified: ${output}`);
    })
    .catch((err) => {
      console.error("Minification failed:", err);
      process.exit(1);
    });
}

function copyAssets() {
  const assets = [
    "newtab.html",
    "style.css",
    "manifest.json",
    "logo.png",
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

function build() {
  console.log("Building production bundle...");
  cleanDist();
  minifyJs();
  copyAssets();
  console.log("Build complete.");
}

build();
