/**
 * Compare a shared Google Drive folder against the games on the site.
 *
 * Lists the (publicly shared) Drive folder via its embedded folder view —
 * no API key or credentials needed — and reports which entries are new,
 * i.e. not already in games/ and not in the drive-ignore.json rejects
 * list. Curation stays manual: you review the candidates and add the good
 * ones with `npm run add-game`; the bad/old ones you reject once and they
 * are never suggested again.
 *
 * Usage:
 *   npm run drive-diff -- "https://drive.google.com/drive/folders/<FOLDER_ID>"
 *   npm run drive-diff                       # reuses the saved folder ID
 *   npm run drive-diff -- --reject "Old Game" "Bad Game"   # never suggest again
 *
 * The folder ID is saved to drive-ignore.json on first run, so afterwards
 * plain `npm run drive-diff` is enough.
 */
const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const gamesDir = path.join(rootDir, "games");
const ignorePath = path.join(rootDir, "drive-ignore.json");

function loadIgnoreFile() {
  if (!fs.existsSync(ignorePath)) {
    return { folderId: null, rejected: [] };
  }
  return JSON.parse(fs.readFileSync(ignorePath, "utf8"));
}

function saveIgnoreFile(data) {
  fs.writeFileSync(ignorePath, JSON.stringify(data, null, 2) + "\n");
}

/** Accepts a full Drive folder URL or a bare folder ID. */
function extractFolderId(input) {
  const urlMatch = input.match(/\/folders\/([A-Za-z0-9_-]+)/);
  if (urlMatch) return urlMatch[1];
  const idMatch = input.match(/[?&]id=([A-Za-z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  if (/^[A-Za-z0-9_-]{10,}$/.test(input)) return input;
  return null;
}

/**
 * List entries in a public Drive folder by scraping the embedded folder
 * view. Works without credentials for folders shared as
 * "anyone with the link".
 */
async function listDriveFolder(folderId) {
  const url = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(
      `Drive returned HTTP ${res.status}. Make sure the folder is shared as "anyone with the link".`
    );
  }
  const html = await res.text();

  const entries = [];
  const entryRegex = /<div class="flip-entry-title">([^<]+)<\/div>/g;
  let match;
  while ((match = entryRegex.exec(html)) !== null) {
    entries.push(
      match[1]
        .replace(/&amp;/g, "&")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, "\"")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim()
    );
  }
  return entries;
}

/** Normalize a name for fuzzy comparison (case, punctuation, extensions). */
function normalizeName(name) {
  return name
    .replace(/\.(html?|zip|7z|rar)$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

async function main() {
  const args = process.argv.slice(2);
  const ignore = loadIgnoreFile();

  // --reject mode: add names to the rejects list and exit
  const rejectIdx = args.indexOf("--reject");
  if (rejectIdx !== -1) {
    const names = args.slice(rejectIdx + 1).filter(a => !a.startsWith("--"));
    if (names.length === 0) {
      console.log("Usage: npm run drive-diff -- --reject \"Game Name\" [\"Another\" ...]");
      process.exit(1);
    }
    names.forEach(n => {
      if (!ignore.rejected.includes(n)) ignore.rejected.push(n);
    });
    ignore.rejected.sort((a, b) => a.localeCompare(b));
    saveIgnoreFile(ignore);
    console.log(`🚫 Rejected ${names.length} name(s). They won't be suggested again.`);
    return;
  }

  const input = args.find(a => !a.startsWith("--"));
  const folderId = input ? extractFolderId(input) : ignore.folderId;
  if (!folderId) {
    console.log(
      "Usage: npm run drive-diff -- \"https://drive.google.com/drive/folders/<FOLDER_ID>\"\n" +
        "(the folder ID is remembered in drive-ignore.json after the first run)"
    );
    process.exit(1);
  }
  if (input && extractFolderId(input) === null) {
    console.error(`❌ Could not extract a folder ID from: ${input}`);
    process.exit(1);
  }

  console.log(`📂 Listing Drive folder ${folderId}...`);
  const entries = await listDriveFolder(folderId);
  if (entries.length === 0) {
    console.log(
      "⚠️  No entries found. Either the folder is empty, not public, or Google\n" +
        "   changed the embedded view markup."
    );
    process.exit(1);
  }

  // Save folder ID for next time
  if (ignore.folderId !== folderId) {
    ignore.folderId = folderId;
    saveIgnoreFile(ignore);
  }

  const onSite = new Set(
    fs
      .readdirSync(gamesDir)
      .filter(f => fs.statSync(path.join(gamesDir, f)).isDirectory())
      .map(normalizeName)
  );
  const rejected = new Set(ignore.rejected.map(normalizeName));

  const candidates = [];
  const existing = [];
  const skipped = [];

  entries.forEach(name => {
    const norm = normalizeName(name);
    if (onSite.has(norm)) existing.push(name);
    else if (rejected.has(norm)) skipped.push(name);
    else candidates.push(name);
  });

  console.log(`\n📊 ${entries.length} entries in Drive:`);
  console.log(`   ✓ Already on site: ${existing.length}`);
  console.log(`   🚫 Rejected earlier: ${skipped.length}`);
  console.log(`   ✨ New candidates: ${candidates.length}\n`);

  if (candidates.length > 0) {
    console.log("✨ New candidates to review:");
    candidates.forEach(name => console.log(`   - ${name}`));
    console.log(
      "\nAdd the good ones:    npm run add-game -- --name \"Name\" --file <html>\n" +
        "Reject the bad ones:  npm run drive-diff -- --reject \"Name\""
    );
  } else {
    console.log("✨ Nothing new — the site is up to date with the Drive folder.");
  }
}

main().catch(e => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
