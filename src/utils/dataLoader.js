const fs = require("fs");
const path = require("path");
const { DEFAULT_THUMBNAILS } = require("./constants");

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

        // Get createdAt date - use JSON value if present, otherwise use file birthtime/mtime
        let createdAt = json.createdAt;
        if (!createdAt) {
          try {
            const stats = fs.statSync(filePath);
            // Use birthtime if available (file creation time), otherwise use mtime (modification time)
            createdAt = stats.birthtime ? stats.birthtime.toISOString() : stats.mtime.toISOString();

            // Update the JSON file to include the createdAt date for future builds
            json.createdAt = createdAt;
            fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n');
          } catch (statError) {
            // If we can't get file stats, use current time as fallback
            createdAt = new Date().toISOString();
            console.warn(`⚠️  Could not get file stats for ${f}, using current time for createdAt`);
          }
        }

        // Support priority value (higher priority = shown first in lists)
        const priority = typeof json.priority === 'number' ? json.priority : 0;

        // Track if JSON needs to be updated
        let jsonNeedsUpdate = false;

        // Support displayName field - auto-generate from name if not present
        if (json.displayName === undefined) {
          json.displayName = json.name || folder;
          jsonNeedsUpdate = true;
        }

        // Support game description field
        // If description is not present in JSON, add it as empty string
        if (json.description === undefined) {
          json.description = "";
          jsonNeedsUpdate = true;
        }
        const description = json.description || ""; // Use the description from JSON (can be empty)

        // Update JSON file if any fields were added
        if (jsonNeedsUpdate) {
          fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n');
        }

        return {
          folder: folder,
          name: json.displayName || json.name || folder,
          otherNames: otherNames, // Array of alternative names for search
          categories: gameCategories, // Array of categories
          thumbs: json.thumbs && json.thumbs.length ? json.thumbs : DEFAULT_THUMBNAILS,
          createdAt: createdAt, // ISO date string for when game was added
          priority: priority, // Priority value for sorting (higher = first)
          description: description // Custom game description (empty string = auto-generate)
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
