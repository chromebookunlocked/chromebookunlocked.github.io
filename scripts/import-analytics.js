/**
 * Import Google Analytics page-view data into popularity.json.
 *
 * Takes a CSV export from GA4 (Reports → Engagement → Pages and screens →
 * Share/Export → Download CSV) — or any CSV with a page-path column and a
 * views column — matches page paths to games, and writes popularity.json
 * at the repo root. The build then orders the home grid by plays and
 * auto-tags the top games as "Trending Games".
 *
 * Usage:
 *   npm run import-analytics -- path/to/ga-export.csv
 *   npm run import-analytics -- report1.csv report2.csv   # sums multiple files
 */
const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const outputPath = path.join(rootDir, "popularity.json");

/**
 * Minimal CSV line parser that handles quoted fields with commas.
 */
function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === "\"" && line[i + 1] === "\"") {
        current += "\"";
        i++;
      } else if (ch === "\"") {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === "\"") {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

/**
 * Parse a GA4 CSV export into [{path, views}]. GA4 exports start with
 * "# ----" comment lines; the real header row contains a page-path column
 * and a views column. Falls back to "first column = path, second = views"
 * for simple hand-made CSVs.
 */
function parseAnalyticsCsv(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .filter(l => l.trim() !== "" && !l.startsWith("#"));

  if (lines.length === 0) return [];

  const header = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
  let pathCol = header.findIndex(h => h.includes("path") || h.includes("page"));
  let viewsCol = header.findIndex(h => h.includes("view"));

  let rows = lines.slice(1);
  if (pathCol === -1 || viewsCol === -1) {
    // No recognizable header — assume path,views with no header row
    pathCol = 0;
    viewsCol = 1;
    rows = lines;
  }

  const entries = [];
  rows.forEach(line => {
    const fields = parseCsvLine(line);
    const pagePath = (fields[pathCol] || "").trim();
    const views = parseInt(String(fields[viewsCol] || "").replace(/[,\s]/g, ""), 10);
    if (pagePath && !isNaN(views)) {
      entries.push({ path: pagePath, views });
    }
  });
  return entries;
}

/**
 * Map a GA page path to a game name. Game pages live at the site root as
 * "/<Game Name>.html" (URL-encoded); the games list is used to resolve
 * exact matches case-insensitively.
 */
function pathToGameName(pagePath, gameNamesByLower) {
  let p = pagePath.split("?")[0].split("#")[0];
  try {
    p = decodeURIComponent(p);
  } catch (e) {
    // keep raw path if it has stray % characters
  }
  p = p.replace(/^\//, "").replace(/\/$/, "");
  if (!p.toLowerCase().endsWith(".html")) return null;
  const name = p.slice(0, -".html".length);
  return gameNamesByLower.get(name.toLowerCase()) || null;
}

function main() {
  const files = process.argv.slice(2).filter(a => !a.startsWith("--"));
  if (files.length === 0) {
    console.log("Usage: npm run import-analytics -- <ga-export.csv> [more.csv ...]");
    process.exit(1);
  }

  const gameNamesByLower = new Map(
    fs
      .readdirSync(dataDir)
      .filter(f => f.endsWith(".json"))
      .map(f => path.basename(f, ".json"))
      .map(name => [name.toLowerCase(), name])
  );

  const plays = {};
  let matched = 0;
  let unmatchedPages = 0;

  files.forEach(file => {
    const entries = parseAnalyticsCsv(fs.readFileSync(file, "utf8"));
    console.log(`📄 ${file}: ${entries.length} page rows`);
    entries.forEach(({ path: pagePath, views }) => {
      const game = pathToGameName(pagePath, gameNamesByLower);
      if (game) {
        plays[game] = (plays[game] || 0) + views;
        matched++;
      } else {
        unmatchedPages++;
      }
    });
  });

  if (matched === 0) {
    console.error(
      "❌ No page paths matched any game. Expected paths like \"/Retro Bowl.html\".\n" +
        "   Check that the CSV has page-path and views columns."
    );
    process.exit(1);
  }

  const sorted = Object.fromEntries(
    Object.entries(plays).sort((a, b) => b[1] - a[1])
  );

  fs.writeFileSync(
    outputPath,
    JSON.stringify({ updatedAt: new Date().toISOString(), plays: sorted }, null, 2) + "\n"
  );

  const top = Object.entries(sorted).slice(0, 10);
  console.log(`\n✅ popularity.json written: ${Object.keys(sorted).length} games (${unmatchedPages} non-game pages ignored)`);
  console.log("\n🔥 Top 10:");
  top.forEach(([name, views], i) => console.log(`   ${i + 1}. ${name} — ${views.toLocaleString()} views`));
  console.log("\nCommit and push popularity.json — the site rebuilds in popular order automatically.");
}

main();
