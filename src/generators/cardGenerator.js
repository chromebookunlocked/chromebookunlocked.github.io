const { chooseThumb, getAssetPath } = require("../utils/assetManager");

/**
 * Generate HTML for a single game card
 * @param {Object} game - Game object
 * @param {number} idx - Card index
 * @param {string} gamesDir - Path to games directory
 * @returns {string} HTML string for game card
 */
function generateGameCard(game, idx, gamesDir) {
  const thumb = chooseThumb(game, gamesDir);
  const thumbPath = getAssetPath(game.folder, thumb);

  // Add fetchpriority="high" for first 6 images (first row) to optimize LCP
  const isFirstRow = idx < 6;
  const loadingAttr = isFirstRow ? 'eager' : 'lazy';
  const fetchPriorityAttr = isFirstRow ? ' fetchpriority="high"' : '';

  return `<div class="card game-card" data-index="${idx}" data-folder="${game.folder}" data-name="${game.name.toLowerCase()}" onclick="window.location.href='/${game.folder}.html'">
    <div class="thumb-container" style="--thumb-url: url('${thumbPath}')">
      <img class="thumb" src="${thumbPath}" alt="${game.name}" loading="${loadingAttr}" decoding="async" width="300" height="300"${fetchPriorityAttr}>
    </div>
    <div class="card-title">${game.name}</div>
  </div>`;
}

/**
 * Generate sidebar category list
 * @param {Object} categories - Categories object
 * @returns {string} HTML string for category sidebar
 */
function generateSidebar(categories) {
  const sidebarCategories = Object.keys(categories)
    .filter(cat => cat !== 'Newly Added' && cat !== 'Recently Played')
    .sort((a, b) => categories[b].length - categories[a].length);

  return sidebarCategories
    .map(cat => `<button class="sidebar-button" onclick="filterCategory('${cat}')">${cat} (${categories[cat].length})</button>`)
    .join('\n');
}

module.exports = {
  generateGameCard,
  generateSidebar
};
