const fs = require("fs");
const path = require("path");

/**
 * Generate XML sitemap for SEO
 * @param {Array} games - Array of game objects
 * @param {string} outputDir - Output directory path
 */
function generateSitemap(games, outputDir) {
  const today = new Date().toISOString().split('T')[0];
  const baseUrl = 'https://chromebookunlocked.github.io';

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- DMCA Page -->
  <url>
    <loc>${baseUrl}/dmca.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>

`;

  // Add all game pages
  games.forEach(game => {
    sitemap += `  <!-- ${game.name} -->
  <url>
    <loc>${baseUrl}/pages/${encodeURIComponent(game.folder)}.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

`;
  });

  sitemap += `</urlset>`;

  // Write sitemap to dist folder
  const sitemapPath = path.join(outputDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap);
  console.log(`✅ Sitemap generated with ${games.length + 2} URLs`);
}

module.exports = {
  generateSitemap
};
