const fs = require("fs");
const path = require("path");

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
 * Get asset path for a game file
 * @param {string} gameFolder - Game folder name
 * @param {string} filename - File name
 * @param {boolean} fromGamePage - If true, adds ../ prefix (for pages in games-html/)
 * @returns {string} Relative path to asset
 */
function getAssetPath(gameFolder, filename, fromGamePage = false) {
  const basePath = `games/${gameFolder}/${filename}`;
  return fromGamePage ? `../${basePath}` : basePath;
}

module.exports = {
  chooseThumb,
  getAssetPath
};
