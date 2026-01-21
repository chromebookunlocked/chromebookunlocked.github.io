const fs = require("fs");
const path = require("path");

// Fallback thumbnail path (relative to site root)
const FALLBACK_THUMBNAIL = "assets/fallback-thumbnail.webp";

/**
 * Find the first existing thumbnail file from the game's thumbnail options
 * @param {Object} game - Game object with folder and thumbs properties
 * @param {string} gamesDir - Path to games directory
 * @returns {string} Thumbnail filename (or first option as fallback)
 */
function chooseThumb(game, gamesDir) {
  const thumb = game.thumbs.find(t =>
    fs.existsSync(path.join(gamesDir, game.folder, t))
  );
  return thumb || game.thumbs[0];
}

/**
 * Check if a game has a valid thumbnail file
 * @param {Object} game - Game object with folder and thumbs properties
 * @param {string} gamesDir - Path to games directory
 * @returns {boolean} True if thumbnail exists
 */
function hasThumbnail(game, gamesDir) {
  return game.thumbs.some(t =>
    fs.existsSync(path.join(gamesDir, game.folder, t))
  );
}

/**
 * Get the thumbnail path for a game, with fallback support
 * @param {Object} game - Game object with folder and thumbs properties
 * @param {string} gamesDir - Path to games directory
 * @returns {{path: string, isFallback: boolean}} Thumbnail path and whether it's a fallback
 */
function getThumbPath(game, gamesDir) {
  if (hasThumbnail(game, gamesDir)) {
    const thumb = chooseThumb(game, gamesDir);
    return {
      path: `games/${game.folder}/${thumb}`,
      isFallback: false
    };
  }
  return {
    path: FALLBACK_THUMBNAIL,
    isFallback: true
  };
}

/**
 * Get asset path for a game file
 * @param {string} gameFolder - Game folder name
 * @param {string} filename - File name
 * @returns {string} Relative path to asset
 */
function getAssetPath(gameFolder, filename) {
  return `games/${gameFolder}/${filename}`;
}

module.exports = {
  chooseThumb,
  hasThumbnail,
  getThumbPath,
  getAssetPath,
  FALLBACK_THUMBNAIL
};
