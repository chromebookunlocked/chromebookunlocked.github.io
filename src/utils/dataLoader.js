const fs = require("fs");
const path = require("path");
const { DEFAULT_THUMBNAILS } = require("./constants");

// Games in the top N by plays are auto-tagged "Trending Games" at build time
const TRENDING_COUNT = 15;

/**
 * Load play counts from popularity.json at the repo root (written by
 * scripts/import-analytics.js). Returns an empty map when the file is
 * absent, so the build works without analytics data.
 * @param {string} dataDir - Path to data directory (popularity.json lives next to it)
 * @returns {Object} Map of game name -> play/view count
 */
function loadPopularity(dataDir) {
  const popularityPath = path.join(dataDir, "..", "popularity.json");
  if (!fs.existsSync(popularityPath)) return {};
  try {
    const json = JSON.parse(fs.readFileSync(popularityPath, "utf8"));
    return json.plays || {};
  } catch (error) {
    console.warn(`⚠️  Could not read popularity.json: ${error.message}`);
    return {};
  }
}

/**
 * Load and validate games from JSON files
 * @param {string} dataDir - Path to data directory
 * @param {string} gamesDir - Path to games directory
 * @returns {Array} Array of validated game objects
 */
function loadGames(dataDir, gamesDir) {
  const popularity = loadPopularity(dataDir);
  const games = fs.readdirSync(dataDir)
    .filter(f => f.endsWith(".json"))
    .map(f => {
      try {
        const filePath = path.join(dataDir, f);
        const json = JSON.parse(fs.readFileSync(filePath, "utf8"));

        // Support multiple categories (comma-separated string or array)
        let gameCategories = json.category || json.categories || "Uncategorized";
        if (typeof gameCategories === "string") {
          gameCategories = gameCategories.split(",").map(c => c.trim());
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
        if (typeof otherNames === "string") {
          otherNames = otherNames.split(",").map(n => n.trim()).filter(n => n);
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
            fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + "\n");
          } catch (statError) {
            // If we can't get file stats, use current time as fallback
            createdAt = new Date().toISOString();
            console.warn(`⚠️  Could not get file stats for ${f}, using current time for createdAt`);
          }
        }

        // Support priority value (higher priority = shown first in lists)
        const priority = typeof json.priority === "number" ? json.priority : 0;

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
          fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + "\n");
        }

        return {
          folder: folder,
          name: json.displayName || json.name || folder,
          otherNames: otherNames, // Array of alternative names for search
          categories: gameCategories, // Array of categories
          thumbs: json.thumbs && json.thumbs.length ? json.thumbs : DEFAULT_THUMBNAILS,
          createdAt: createdAt, // ISO date string for when game was added
          priority: priority, // Priority value for sorting (higher = first)
          plays: popularity[json.name] || popularity[folder] || 0, // View count from analytics
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

  // Auto-tag the most-played games as "Trending Games" so the tag
  // maintains itself from analytics data instead of manual edits.
  // Manually tagged games keep the tag either way.
  const topPlayed = games
    .filter(g => g.plays > 0)
    .sort((a, b) => b.plays - a.plays)
    .slice(0, TRENDING_COUNT);
  topPlayed.forEach(g => {
    if (!g.categories.includes("Trending Games")) {
      g.categories.push("Trending Games");
    }
  });
  if (topPlayed.length > 0) {
    console.log(`🔥 Auto-tagged top ${topPlayed.length} games as Trending (from popularity.json)`);
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
