const fs = require("fs");
const path = require("path");
const { getThumbPath } = require("../utils/assetManager");

/**
 * Generate XML sitemap with image sitemap support for SEO
 * @param {Array} games - Array of game objects
 * @param {Array} newsArticles - Array of news article objects
 * @param {string} outputDir - Output directory path
 * @param {string} gamesDir - Games directory path for thumbnail resolution
 */
function generateSitemap(games, newsArticles = [], outputDir, gamesDir = './games') {
  const today = new Date().toISOString().split('T')[0];
  const baseUrl = 'https://chromebookunlocked.github.io';

  // XML sitemap with image namespace for rich results
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd
        http://www.google.com/schemas/sitemap-image/1.1
        http://www.google.com/schemas/sitemap-image/1.1/sitemap-image.xsd">

  <!-- Homepage - Free Unblocked Games for School -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${baseUrl}/assets/logo.png</image:loc>
      <image:title>Chromebook Unlocked Games - Free Unblocked Games for School</image:title>
      <image:caption>Play 100+ free unblocked games online at school on your Chromebook</image:caption>
    </image:image>
  </url>

  <!-- DMCA Page -->
  <url>
    <loc>${baseUrl}/dmca.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>

`;

  // Add all game pages with image information for rich search results
  games.forEach(game => {
    // Get thumbnail path for image sitemap (with fallback support)
    const thumbInfo = getThumbPath(game, gamesDir);
    const thumbPath = thumbInfo.path;

    const gameUrl = `${baseUrl}/${encodeURIComponent(game.folder)}.html`;
    const imageUrl = `${baseUrl}/${thumbPath}`;
    const categories = game.categories ? game.categories.join(', ') : 'Games';

    sitemap += `  <!-- ${game.name} - Free Unblocked Game -->
  <url>
    <loc>${gameUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${baseUrl}/assets/logo.png</image:loc>
      <image:title>${game.name} Unblocked - Play Free Online Game</image:title>
      <image:caption>Play ${game.name} unblocked for free at school. ${categories} game that works on Chromebook and school computers.</image:caption>
    </image:image>
  </url>

`;
  });

  // Add news listing page
  sitemap += `  <!-- News & Updates page -->
  <url>
    <loc>${baseUrl}/news.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>

`;

  // Add individual news article pages
  newsArticles.forEach(article => {
    const articleDate = article.date ? article.date.split('T')[0] : today;
    sitemap += `  <!-- News: ${article.title} -->
  <url>
    <loc>${baseUrl}/news-${encodeURIComponent(article.slug)}.html</loc>
    <lastmod>${articleDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

`;
  });

  sitemap += `</urlset>`;

  // Write sitemap to dist folder
  const sitemapPath = path.join(outputDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap);
  console.log(`✅ Sitemap generated with ${games.length + 2 + newsArticles.length + 1} URLs (with image metadata)`);

  // Also generate robots.txt with sitemap reference
  generateRobotsTxt(outputDir, baseUrl);
}

/**
 * Generate robots.txt file with sitemap reference
 * @param {string} outputDir - Output directory path
 * @param {string} baseUrl - Base URL of the site
 */
function generateRobotsTxt(outputDir, baseUrl) {
  const robotsTxt = `# Robots.txt for Chromebook Unlocked Games
# Free Unblocked Games for School

User-agent: *
Allow: /

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay (be polite to servers)
Crawl-delay: 1

# Allow all search engine bots
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /

User-agent: DuckDuckBot
Allow: /

# Block game iframe content from being indexed separately (they should access game pages)
User-agent: *
Disallow: /games/*/index.html
`;

  const robotsPath = path.join(outputDir, 'robots.txt');
  fs.writeFileSync(robotsPath, robotsTxt);
  console.log(`✅ robots.txt generated with sitemap reference`);
}

module.exports = {
  generateSitemap,
  generateRobotsTxt
};
