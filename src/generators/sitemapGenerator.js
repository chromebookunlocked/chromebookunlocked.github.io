const fs = require("fs");
const path = require("path");
const { getThumbPath } = require("../utils/assetManager");
const {
  BASE_URL,
  SITE_NAME,
  gamePageUrl,
  assetUrl,
  joinList
} = require("../utils/seoBuilder");

function escapeXml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate XML sitemap (with game thumbnails) for search engines.
 *
 * Only the homepage carries <lastmod>: its game order is reshuffled on every
 * build, so the build date is true for it. Game and category pages have no
 * tracked modification date, and stamping the build date on all of them would
 * tell crawlers every page changed when it did not.
 *
 * @param {Array} games - Array of game objects
 * @param {string} outputDir - Output directory path
 * @param {string} gamesDir - Games directory path for thumbnail resolution
 * @param {Array} categoryPages - generated category pages
 */
function generateSitemap(games, outputDir, gamesDir = './games', categoryPages = []) {
  const today = new Date().toISOString().split('T')[0];

  const urls = [];
  urls.push(`  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
  </url>`);

  categoryPages.forEach((page) => {
    urls.push(`  <url>
    <loc>${escapeXml(page.url)}</loc>
  </url>`);
  });

  games.forEach((game) => {
    const thumbInfo = getThumbPath(game, gamesDir);
    urls.push(`  <url>
    <loc>${escapeXml(gamePageUrl(game))}</loc>
    <image:image>
      <image:loc>${escapeXml(assetUrl(thumbInfo.path))}</image:loc>
    </image:image>
  </url>`);
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>
`;

  fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), sitemap);
  console.log(`✅ Sitemap generated with ${urls.length} URLs (homepage, ${categoryPages.length} categories, ${games.length} games)`);

  generateRobotsTxt(outputDir, BASE_URL);
  generateLlmsTxt(games, outputDir, categoryPages);
}

/**
 * Generate robots.txt.
 *
 * One group for every crawler. A separate "User-agent: Googlebot" group would
 * make Googlebot ignore the rules in the "*" group, including the Disallow.
 */
function generateRobotsTxt(outputDir, baseUrl) {
  const robotsTxt = `# robots.txt for ${SITE_NAME}

User-agent: *
Allow: /
# Raw game files are loaded inside the game pages; the game pages are what should be indexed.
Disallow: /games/*/index.html

Sitemap: ${baseUrl}/sitemap.xml
`;

  fs.writeFileSync(path.join(outputDir, 'robots.txt'), robotsTxt);
  console.log(`✅ robots.txt generated with sitemap reference`);
}

/**
 * Generate llms.txt: a short, factual description of the site with links,
 * for AI assistants that read it.
 */
function generateLlmsTxt(games, outputDir, categoryPages = []) {
  const featured = [...games]
    .filter((game) => game.priority > 0)
    .sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name, 'en'));
  const topCategories = categoryPages.slice(0, 6).map((page) => page.name);

  const lines = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_NAME} (chromebookunlocked.github.io) is a free website with ${games.length} browser games. Each game has its own page and runs in a browser tab, so it can be played on a Chromebook, Windows PC or Mac without downloading or installing anything.`,
    '',
    '## Facts',
    '',
    `- Number of games: ${games.length}`,
    '- Price: free, no account needed',
    '- Platform: web browser (HTML5); no download or install',
    `- Game page address pattern: ${BASE_URL}/<Game Name>.html`,
    topCategories.length ? `- Largest categories: ${joinList(topCategories)}` : null,
    '- Whether the site loads on a school network depends on that network\'s filter.',
    '',
    '## Main pages',
    '',
    `- [All unblocked games](${BASE_URL}/): homepage with search and the full game list`,
    `- [Contact](${BASE_URL}/important-pages/contact.html)`,
    `- [DMCA and copyright](${BASE_URL}/important-pages/dmca.html)`,
    `- [Privacy policy](${BASE_URL}/important-pages/privacy-policy.html)`,
    '',
  ].filter((line) => line !== null);

  if (categoryPages.length) {
    lines.push('## Game categories', '');
    categoryPages.forEach((page) => {
      lines.push(`- [${page.heading}](${page.url}): ${page.games.length} games`);
    });
    lines.push('');
  }

  if (featured.length) {
    lines.push('## Featured games', '');
    featured.forEach((game) => {
      lines.push(`- [${game.name}](${gamePageUrl(game)})`);
    });
    lines.push('');
  }

  lines.push('## All games', '');
  [...games]
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))
    .forEach((game) => {
      lines.push(`- [${game.name}](${gamePageUrl(game)})`);
    });
  lines.push('');

  fs.writeFileSync(path.join(outputDir, 'llms.txt'), lines.join('\n'));
  console.log(`✅ llms.txt generated`);
}

module.exports = {
  generateSitemap,
  generateRobotsTxt,
  generateLlmsTxt
};
