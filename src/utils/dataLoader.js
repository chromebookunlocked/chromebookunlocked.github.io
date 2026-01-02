const fs = require("fs");
const path = require("path");

/**
 * Load and validate games from JSON files
 * @param {string} dataDir - Path to data directory
 * @param {string} gamesDir - Path to games directory
 * @returns {Array} Array of validated game objects
 */
function loadGames(dataDir, gamesDir) {
  const games = fs.readdirSync(dataDir)
    .filter(f => f.endsWith(".json"))
    .map(f => {
      try {
        const filePath = path.join(dataDir, f);
        const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // Support multiple categories (comma-separated string or array)
        let gameCategories = json.category || json.categories || "Uncategorized";
        if (typeof gameCategories === 'string') {
          gameCategories = gameCategories.split(',').map(c => c.trim());
        }
        if (!Array.isArray(gameCategories)) {
          gameCategories = [gameCategories];
        }

        const folder = json.folder || f.replace(".json", "");

        // Validate game folder and index.html exist
        const gamePath = path.join(gamesDir, folder);
        const indexPath = path.join(gamePath, "index.html");

        if (!fs.existsSync(gamePath)) {
          console.log(`⚠️  Skipping game "${json.name || folder}" - folder not found at: ${gamePath}`);
          return null;
        }

        if (!fs.existsSync(indexPath)) {
          console.log(`⚠️  Skipping game "${json.name || folder}" - index.html not found`);
          return null;
        }

        // Support otherNames for search aliases (can be string or array)
        let otherNames = json.otherNames || [];
        if (typeof otherNames === 'string') {
          otherNames = otherNames.split(',').map(n => n.trim()).filter(n => n);
        }
        if (!Array.isArray(otherNames)) {
          otherNames = [];
        }

        return {
          folder: folder,
          name: json.displayName || json.name || folder,
          otherNames: otherNames, // Array of alternative names for search
          categories: gameCategories, // Array of categories
          thumbs: json.thumbs && json.thumbs.length ? json.thumbs : ["thumbnail.webp", "thumbnail.png", "thumbnail.jpg"]
        };
      } catch (error) {
        console.error(`❌ Error processing ${f}: ${error.message}`);
        return null;
      }
    })
    .filter(game => game !== null); // Remove invalid games

  if (games.length === 0) {
    console.error("❌ No valid games found! Build aborted.");
    process.exit(1);
  }

  return games;
}

/**
 * Group games into categories
 * @param {Array} games - Array of game objects
 * @returns {Object} Object with category keys and arrays of games
 */
function categorizeGames(games) {
  const categories = {};

  games.forEach(g => {
    g.categories.forEach(cat => {
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(g);
    });
  });

  return categories;
}

module.exports = {
  loadGames,
  categorizeGames
};
