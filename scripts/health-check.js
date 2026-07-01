/**
 * Game health check — detects link rot.
 *
 * Games in this repo are thin HTML wrappers whose assets live on external
 * CDNs (via <base href> or absolute URLs). When those URLs die (repo
 * deleted, DMCA takedown, CDN change), the game silently breaks. This
 * script extracts the external URLs each game depends on and verifies
 * they still respond.
 *
 * Usage:
 *   npm run health-check                  # check all games
 *   npm run health-check -- "Slope"       # check specific game(s)
 *   npm run health-check -- --report health-report.md   # write markdown report
 *   npm run health-check -- --no-fail     # always exit 0 (for CI reporting)
 */
const fs = require("fs");
const path = require("path");

const gamesDir = path.join(__dirname, "..", "games");

const TIMEOUT_MS = 15000;
const CONCURRENCY = 8;
const URLS_PER_GAME = 3;

// URLs on these hosts are ads/analytics/etc — not game assets
const IGNORED_HOSTS = [
  "www.googletagmanager.com",
  "www.google-analytics.com",
  "pagead2.googlesyndication.com",
  "challenges.cloudflare.com",
  "fonts.googleapis.com",
  "fonts.gstatic.com"
];

// Asset types most likely to be load-bearing, checked first
const PRIORITY_EXTS = [".js", ".wasm", ".data", ".unityweb", ".css", ".json"];
// File extensions that count as game assets when found in href attributes
// (a bare href to some website is a link, not a dependency)
const ASSET_EXTS = [
  ...PRIORITY_EXTS,
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg",
  ".mp3", ".ogg", ".wav", ".mem", ".swf", ".pck", ".bin", ".zip"
];

function hasAssetExtension(url) {
  const pathname = url.split("?")[0].toLowerCase();
  return ASSET_EXTS.some(ext => pathname.endsWith(ext));
}

/**
 * Extract the external asset URLs a game's index.html depends on.
 * Returns up to URLS_PER_GAME absolute http(s) URLs, prioritizing
 * script/data assets. Plain page links (href without an asset
 * extension) and the <base> tag itself are ignored.
 */
function extractUrls(html) {
  const urls = new Set();

  const baseMatch = html.match(/<base\s+href=["']([^"']+)["']/i);
  const baseUrl = baseMatch ? baseMatch[1] : null;

  const attrRegex = /(src|href|data-src)\s*=\s*["']([^"'\s>]+)["']/gi;
  let match;
  while ((match = attrRegex.exec(html)) !== null) {
    const attr = match[1].toLowerCase();
    const raw = match[2];
    if (/^(data:|javascript:|mailto:|#|about:)/i.test(raw)) continue;
    // href must point at an actual asset file to count as a dependency
    if (attr === "href" && !hasAssetExtension(raw)) continue;

    let absolute = null;
    if (/^https?:\/\//i.test(raw)) {
      absolute = raw;
    } else if (baseUrl && !raw.startsWith("/")) {
      try {
        absolute = new URL(raw, baseUrl).href;
      } catch (e) {
        continue;
      }
    }
    if (!absolute) continue;

    try {
      const host = new URL(absolute).hostname;
      if (IGNORED_HOSTS.includes(host)) continue;
    } catch (e) {
      continue;
    }
    urls.add(absolute);
  }

  const sorted = [...urls].sort((a, b) => {
    const score = u =>
      PRIORITY_EXTS.some(ext => u.split("?")[0].toLowerCase().endsWith(ext)) ? 0 : 1;
    return score(a) - score(b);
  });

  return { baseUrl, urls: sorted.slice(0, URLS_PER_GAME) };
}

/** Check one URL. HEAD first; fall back to a 1-byte ranged GET on 405/501. */
async function checkUrl(url) {
  const attempt = async method => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method,
        redirect: "follow",
        signal: controller.signal,
        headers: method === "GET" ? { Range: "bytes=0-0" } : {}
      });
      return res.status;
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    let status = await attempt("HEAD");
    if (status === 405 || status === 501 || status === 403) {
      status = await attempt("GET");
    }
    return { ok: status < 400, status };
  } catch (e) {
    return { ok: false, status: 0, error: e.name === "AbortError" ? "timeout" : e.message };
  }
}

async function checkGame(gameFolder) {
  const indexPath = path.join(gamesDir, gameFolder, "index.html");
  const html = fs.readFileSync(indexPath, "utf8");
  const { urls } = extractUrls(html);

  if (urls.length === 0) {
    return { game: gameFolder, status: "self-contained", failures: [] };
  }

  const results = await Promise.all(
    urls.map(async url => ({ url, ...(await checkUrl(url)) }))
  );

  const failures = results.filter(r => !r.ok);
  return {
    game: gameFolder,
    status: failures.length === 0 ? "ok" : "broken",
    checked: results.length,
    failures
  };
}

async function runWithConcurrency(items, worker, limit) {
  const results = [];
  let index = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const i = index++;
      results[i] = await worker(items[i]);
    }
  });
  await Promise.all(runners);
  return results;
}

function buildMarkdownReport(broken, okCount, selfContainedCount) {
  const lines = [
    "# 🩺 Game health report",
    "",
    `_Generated ${new Date().toISOString()}_`,
    "",
    `- ✅ Healthy: **${okCount}**`,
    `- 📦 Self-contained (no external URLs): **${selfContainedCount}**`,
    `- ❌ Broken: **${broken.length}**`,
    ""
  ];

  if (broken.length === 0) {
    lines.push("All games are healthy! 🎉");
  } else {
    lines.push("## Broken games", "");
    broken.forEach(r => {
      lines.push(`### ${r.game}`);
      r.failures.forEach(f => {
        const detail = f.error ? f.error : `HTTP ${f.status}`;
        lines.push(`- \`${f.url}\` → ${detail}`);
      });
      lines.push("");
    });
    lines.push(
      "> A broken asset URL usually means the source CDN/repo was removed.",
      "> Fix by re-sourcing the game (replace `games/<name>/index.html`)",
      "> or removing the game folder."
    );
  }

  return lines.join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const noFail = args.includes("--no-fail");
  const reportIdx = args.indexOf("--report");
  const reportPath = reportIdx !== -1 ? args[reportIdx + 1] : null;
  const names = args.filter(
    (a, i) => !a.startsWith("--") && (reportIdx === -1 || i !== reportIdx + 1)
  );

  let targets = names;
  if (targets.length === 0) {
    targets = fs
      .readdirSync(gamesDir)
      .filter(f => fs.statSync(path.join(gamesDir, f)).isDirectory())
      .filter(f => fs.existsSync(path.join(gamesDir, f, "index.html")));
  }

  console.log(`🩺 Checking ${targets.length} game(s)...\n`);

  const results = await runWithConcurrency(targets, checkGame, CONCURRENCY);

  const broken = results.filter(r => r.status === "broken");
  const selfContained = results.filter(r => r.status === "self-contained");
  const okCount = results.length - broken.length - selfContained.length;

  results.forEach(r => {
    if (r.status === "broken") {
      console.log(`❌ ${r.game}`);
      r.failures.forEach(f =>
        console.log(`     ${f.url} → ${f.error || `HTTP ${f.status}`}`)
      );
    }
  });

  console.log(`\n📊 Summary: ✅ ${okCount} ok · 📦 ${selfContained.length} self-contained · ❌ ${broken.length} broken`);

  if (reportPath) {
    fs.writeFileSync(reportPath, buildMarkdownReport(broken, okCount, selfContained.length) + "\n");
    console.log(`📝 Report written to ${reportPath}`);
  }

  if (broken.length > 0 && !noFail) {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(e => {
    console.error(`❌ ${e.message}`);
    process.exit(1);
  });
}

module.exports = { extractUrls, checkUrl, checkGame };
