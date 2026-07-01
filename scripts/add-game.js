/**
 * Add a new game in one command: creates the game folder, writes
 * index.html (from a local file or URL), generates a thumbnail
 * (screenshot, downloaded image, or fallback), suggests category tags,
 * and writes the data/<name>.json metadata file.
 *
 * Usage:
 *   npm run add-game -- --name "Cool Game" --file ./cool-game.html
 *   npm run add-game -- --name "Cool Game" --url "https://example.com/game.html"
 *
 * Options:
 *   --name <name>          Game name (required, becomes folder + page name)
 *   --file <path>          Local HTML file to use as index.html
 *   --url <url>            URL to download the game HTML from
 *   --tags "A, B"          Category tags (default: auto-suggested from name)
 *   --thumbnail <path|url> Thumbnail image (default: headless screenshot)
 *   --no-screenshot        Skip the screenshot step (fallback thumb is used)
 *   --force                Overwrite an existing game with the same name
 */
const fs = require("fs");
const path = require("path");
const { suggestTags, normalizeTags } = require("./lib/tag-utils");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "games");
const dataDir = path.join(rootDir, "data");

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

async function download(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Failed to download ${url} (HTTP ${res.status})`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function writeThumbnailFromImage(source, thumbPath) {
  const sharp = require("sharp");
  const buffer = /^https?:\/\//i.test(source)
    ? await download(source)
    : fs.readFileSync(source);
  await sharp(buffer)
    .resize(300, 300, { fit: "cover", position: "centre" })
    .webp({ quality: 80 })
    .toFile(thumbPath);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const name = (args.name || args._[0] || "").trim();

  if (!name || (!args.file && !args.url)) {
    console.log(
      "Usage: npm run add-game -- --name \"Game Name\" (--file game.html | --url https://…)\n" +
        "       [--tags \"Action, Racing\"] [--thumbnail img-or-url] [--no-screenshot] [--force]"
    );
    process.exit(1);
  }

  if (/[/\\<>:"|?*]/.test(name)) {
    console.error(`❌ Game name contains invalid characters for a folder/URL: "${name}"`);
    process.exit(1);
  }

  const gamePath = path.join(gamesDir, name);
  const jsonPath = path.join(dataDir, `${name}.json`);

  if (fs.existsSync(gamePath) && !args.force) {
    console.error(`❌ games/${name}/ already exists (use --force to overwrite)`);
    process.exit(1);
  }

  // 1. Game HTML
  console.log(`\n🎮 Adding "${name}"...`);
  const html = args.url
    ? (await download(args.url)).toString("utf8")
    : fs.readFileSync(args.file, "utf8");

  if (html.trim().length < 100) {
    console.error(`❌ Game HTML looks empty/too small (${html.trim().length} bytes)`);
    process.exit(1);
  }

  fs.mkdirSync(gamePath, { recursive: true });
  fs.writeFileSync(path.join(gamePath, "index.html"), html);
  console.log(`   ✅ games/${name}/index.html (${(html.length / 1024).toFixed(1)} KB)`);

  // 2. Tags
  let tags;
  if (args.tags) {
    tags = normalizeTags(args.tags).tags;
  } else {
    tags = suggestTags(name, html.slice(0, 2000));
    if (tags.length === 0) tags = ["Uncategorized"];
    console.log(`   🏷️  Suggested tags: ${tags.join(", ")} (override with --tags "…")`);
  }

  // 3. Metadata JSON
  const data = {
    name,
    displayName: name,
    category: tags.join(", "),
    createdAt: new Date().toISOString(),
    description: ""
  };
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + "\n");
  console.log(`   ✅ data/${name}.json`);

  // 4. Thumbnail
  const thumbPath = path.join(gamePath, "thumbnail.webp");
  if (args.thumbnail) {
    await writeThumbnailFromImage(args.thumbnail, thumbPath);
    console.log(`   ✅ thumbnail.webp (from ${args.thumbnail})`);
  } else if (!args["no-screenshot"]) {
    console.log("   📸 Taking screenshot for thumbnail...");
    try {
      const { screenshotGame, startStaticServer, loadPlaywright } = require("./screenshot-thumbnail");
      const playwright = loadPlaywright();
      const launchOptions = process.env.CHROMIUM_PATH
        ? { executablePath: process.env.CHROMIUM_PATH }
        : {};
      const browser = await playwright.chromium.launch(launchOptions);
      const { server, port } = await startStaticServer();
      try {
        const result = await screenshotGame(browser, port, name, { force: true });
        if (result.ok) {
          console.log("   ✅ thumbnail.webp (screenshot)");
        } else {
          console.log(`   ⚠️  Screenshot failed: ${result.reason}`);
          console.log("      The site will use the fallback thumbnail. Retry later with:");
          console.log(`      npm run screenshot -- --force --click "${name}"`);
        }
      } finally {
        await browser.close();
        server.close();
      }
    } catch (e) {
      console.log(`   ⚠️  Screenshot failed: ${e.message.split("\n")[0]}`);
      console.log("      The site will use the fallback thumbnail.");
    }
  }

  // 5. Quick health check on the new game's external URLs
  try {
    const { checkGame } = require("./health-check");
    const health = await checkGame(name);
    if (health.status === "broken") {
      console.log("   ⚠️  Some asset URLs are unreachable — the game may not work:");
      health.failures.forEach(f =>
        console.log(`      ${f.url} → ${f.error || `HTTP ${f.status}`}`)
      );
    } else {
      console.log(`   🩺 Asset URLs reachable (${health.status})`);
    }
  } catch (e) {
    console.log(`   ⚠️  Health check skipped: ${e.message.split("\n")[0]}`);
  }

  console.log("\n✨ Done! Review the files, then commit and push — the site");
  console.log("   rebuilds automatically on push to main.\n");
}

main().catch(e => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
