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

        return {
          folder: folder,
          name: json.name || f.replace(".json", ""),
          categories: gameCategories, // Array of categories
          thumbs: json.thumbs && json.thumbs.length ? json.thumbs : ["thumbnail.png", "thumbnail.jpg"],
          dateAdded: json.dateAdded || null, // Support for "Newly Added" sorting
          trending: json.trending || false // Support for "Trending Games" category
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

  // Add "Trending Games" category if games are marked as trending
  const trendingGames = games.filter(g => g.trending);
  if (trendingGames.length > 0) {
    categories['Trending Games'] = trendingGames;
  }

  // Add "Newly Added" category if games have dateAdded
  const gamesWithDates = games.filter(g => g.dateAdded)
    .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

  if (gamesWithDates.length > 0) {
    categories['Newly Added'] = gamesWithDates.slice(0, 20); // Show latest 20 games
  }

  return categories;
}

module.exports = {
  loadGames,
  categorizeGames
};
