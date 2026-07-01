/**
 * Generate game thumbnails automatically by loading each game in a headless
 * browser and screenshotting it — no more hunting for images online.
 *
 * Usage:
 *   npm run screenshot -- "Game Name" ["Another Game" ...]
 *   npm run screenshot -- --missing        # all games without a thumbnail
 *   npm run screenshot -- --force "Slope"  # overwrite existing thumbnail
 *
 * Options:
 *   --delay <ms>   Wait time after page load before screenshotting (default 12000)
 *   --click        Click the center of the page after load (starts some games)
 *
 * Requires Playwright (one-time setup):
 *   npm install --no-save playwright && npx playwright install chromium
 */
const fs = require("fs");
const path = require("path");
const http = require("http");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "games");

const THUMB_SIZE = 300;
const WEBP_QUALITY = 80;
const VIEWPORT = { width: 800, height: 600 };

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".wasm": "application/wasm"
};

function loadPlaywright() {
  try {
    return require("playwright");
  } catch (e) {
    try {
      return require("playwright-core");
    } catch (e2) {
      console.error(
        "❌ Playwright is not installed. One-time setup:\n" +
          "   npm install --no-save playwright && npx playwright install chromium"
      );
      process.exit(1);
    }
  }
}

/** Serve the repo root so game pages (and root-absolute asset paths) load. */
function startStaticServer() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split("?")[0]);
      let filePath = path.join(rootDir, urlPath);
      if (!filePath.startsWith(rootDir)) {
        res.writeHead(403).end();
        return;
      }
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }
      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(404).end();
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          "Content-Type": MIME_TYPES[ext] || "application/octet-stream"
        });
        res.end(content);
      });
    });
    server.listen(0, "127.0.0.1", () => {
      resolve({ server, port: server.address().port });
    });
  });
}

function hasThumbnail(gameFolder) {
  const exts = [".webp", ".png", ".jpg", ".jpeg", ".gif"];
  return exts.some(ext =>
    fs.existsSync(path.join(gamesDir, gameFolder, `thumbnail${ext}`))
  );
}

/**
 * Screenshot a single game and write games/<name>/thumbnail.webp.
 * Returns { ok, reason } — a screenshot that is a near-uniform (blank/black)
 * frame is rejected so a broken load doesn't produce a useless thumbnail.
 */
async function screenshotGame(browser, port, gameFolder, options = {}) {
  const { delay = 12000, click = false, force = false } = options;
  const thumbPath = path.join(gamesDir, gameFolder, "thumbnail.webp");

  if (!force && hasThumbnail(gameFolder)) {
    return { ok: false, reason: "thumbnail already exists (use --force)" };
  }

  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  try {
    const url = `http://127.0.0.1:${port}/games/${encodeURIComponent(gameFolder)}/index.html`;
    await page.goto(url, { waitUntil: "load", timeout: 60000 });

    if (click) {
      await page.mouse.click(VIEWPORT.width / 2, VIEWPORT.height / 2);
    }
    await page.waitForTimeout(delay);

    const buffer = await page.screenshot({ type: "png" });

    // Reject near-uniform frames (game failed to render anything useful)
    const sharp = require("sharp");
    const stats = await sharp(buffer).stats();
    const maxStdev = Math.max(...stats.channels.map(c => c.stdev));
    if (maxStdev < 8) {
      return { ok: false, reason: `frame looks blank (stdev ${maxStdev.toFixed(1)}) — game may need interaction or more --delay` };
    }

    await sharp(buffer)
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: "cover", position: "centre" })
      .webp({ quality: WEBP_QUALITY })
      .toFile(thumbPath);

    return { ok: true, path: thumbPath };
  } finally {
    await context.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const click = args.includes("--click");
  const missing = args.includes("--missing");
  const delayIdx = args.indexOf("--delay");
  const delay = delayIdx !== -1 ? parseInt(args[delayIdx + 1], 10) : 12000;

  const names = args.filter(
    (a, i) => !a.startsWith("--") && (delayIdx === -1 || i !== delayIdx + 1)
  );

  let targets = names;
  if (missing) {
    targets = fs
      .readdirSync(gamesDir)
      .filter(f => fs.statSync(path.join(gamesDir, f)).isDirectory())
      .filter(f => !hasThumbnail(f));
  }

  if (targets.length === 0) {
    console.log(missing
      ? "✨ All games already have thumbnails."
      : "Usage: npm run screenshot -- \"Game Name\" | --missing [--force] [--click] [--delay ms]");
    return;
  }

  for (const name of targets) {
    if (!fs.existsSync(path.join(gamesDir, name, "index.html"))) {
      console.error(`❌ No such game: games/${name}/index.html`);
      process.exitCode = 1;
      return;
    }
  }

  const playwright = loadPlaywright();
  const launchOptions = {};
  // Support environments with a pre-installed Chromium (e.g. CI images)
  if (process.env.CHROMIUM_PATH) {
    launchOptions.executablePath = process.env.CHROMIUM_PATH;
  }
  const browser = await playwright.chromium.launch(launchOptions);
  const { server, port } = await startStaticServer();

  console.log(`📸 Screenshotting ${targets.length} game(s) (delay ${delay}ms)...\n`);
  let ok = 0;
  let failed = 0;

  try {
    for (const name of targets) {
      process.stdout.write(`   ${name} ... `);
      try {
        const result = await screenshotGame(browser, port, name, { delay, click, force });
        if (result.ok) {
          const kb = (fs.statSync(result.path).size / 1024).toFixed(0);
          console.log(`✅ thumbnail.webp (${kb} KB)`);
          ok++;
        } else {
          console.log(`⚠️  skipped: ${result.reason}`);
          failed++;
        }
      } catch (e) {
        console.log(`❌ ${e.message.split("\n")[0]}`);
        failed++;
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`\n📊 Done: ${ok} created, ${failed} skipped/failed.`);
}

if (require.main === module) {
  main().catch(e => {
    console.error(`❌ ${e.message}`);
    process.exit(1);
  });
}

module.exports = { screenshotGame, startStaticServer, loadPlaywright, hasThumbnail };
