#!/usr/bin/env node

/**
 * Main build script for Chromebook Unlocked Games
 *
 * This script orchestrates the generation of the static site by:
 * 1. Loading and validating game data
 * 2. Generating the main index page
 * 3. Generating individual game pages
 * 4. Creating XML sitemap for SEO
 */

const fs = require("fs");
const path = require("path");

// Import utilities
const { loadGames, categorizeGames } = require("./src/utils/dataLoader");
const { generateSitemap } = require("./src/generators/sitemapGenerator");

// Import generators
const { generateIndexHTML } = require("./src/generators/indexGenerator");
const { generateGamePage } = require("./src/generators/gamePageGenerator");

// Configuration
const dataDir = path.join(__dirname, "data");
const gamesDir = path.join(__dirname, "games");
const outputDir = path.join(__dirname, "dist");
const templatesDir = path.join(__dirname, "templates");

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log("🚀 Starting build process...\n");

// Step 1: Load game data
console.log("📦 Loading game data...");
const games = loadGames(dataDir, gamesDir);
console.log(`✅ Loaded ${games.length} games\n`);

// Step 2: Categorize games
console.log("📁 Categorizing games...");
const categories = categorizeGames(games);
console.log(`✅ Created ${Object.keys(categories).length} categories\n`);

// Step 3: Load CSS and JavaScript templates
console.log("🎨 Loading templates...");
const mainStyles = fs.readFileSync(path.join(templatesDir, "main-styles.css"), "utf8");
const gamePageStyles = fs.readFileSync(path.join(templatesDir, "game-page-styles.css"), "utf8");
const clientJS = fs.readFileSync(path.join(templatesDir, "client.js"), "utf8");
console.log("✅ Templates loaded\n");

// Step 3.5: Write external CSS and JS files for better caching
console.log("📄 Writing external CSS and JS files...");
fs.writeFileSync(path.join(outputDir, "styles.css"), mainStyles);
fs.writeFileSync(path.join(outputDir, "game-styles.css"), gamePageStyles);
fs.writeFileSync(path.join(outputDir, "client.js"), clientJS);
console.log("✅ External files created\n");

// Step 4: Generate main index page
console.log("🏠 Generating main index page...");
const indexHTML = generateIndexHTML(games, categories, mainStyles, clientJS, gamesDir);
const indexPath = path.join(outputDir, "index.html");
fs.writeFileSync(indexPath, indexHTML);
console.log(`✅ Created ${indexPath}\n`);

// Step 5: Generate individual game pages
console.log("🎮 Generating game pages...");
let generatedCount = 0;

games.forEach(game => {
  const gameHTML = generateGamePage(game, games, categories, gamePageStyles, gamesDir);
  const gamePagePath = path.join(outputDir, `${game.folder}.html`);
  fs.writeFileSync(gamePagePath, gameHTML);
  generatedCount++;

  // Progress indicator
  if (generatedCount % 10 === 0) {
    process.stdout.write(`   Generated ${generatedCount}/${games.length} pages...\r`);
  }
});

console.log(`✅ Generated ${generatedCount} game pages\n`);

// Step 6: Generate sitemap
console.log("🗺️  Generating sitemap...");
generateSitemap(games, outputDir);

// Build complete
console.log("\n✨ Build complete! All files generated successfully.\n");
console.log("📊 Build summary:");
console.log(`   - Games: ${games.length}`);
console.log(`   - Categories: ${Object.keys(categories).length}`);
console.log(`   - Total pages: ${games.length + 1} (index + games)`);
console.log(`   - Output directory: ${outputDir}\n`);
