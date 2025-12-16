const { chooseThumb, getAssetPath } = require("../utils/assetManager");

/**
 * Generate HTML for a single game card
 * @param {Object} game - Game object
 * @param {number} idx - Card index within category
 * @param {string} gamesDir - Path to games directory
 * @param {boolean} isFirstCategory - Whether this is the first/largest category
 * @returns {string} HTML string for game card
 */
function generateGameCard(game, idx, gamesDir, isFirstCategory = false) {
  const thumb = chooseThumb(game, gamesDir);
  const thumbPath = getAssetPath(game.folder, thumb);

  // Only eagerly load first 6 images of the first category to optimize initial page load
  // All other images use data-src and load when they become visible
  const shouldEagerLoad = isFirstCategory && idx < 6;
  const loadingAttr = shouldEagerLoad ? 'eager' : 'lazy';
  const fetchPriorityAttr = shouldEagerLoad ? ' fetchpriority="high"' : '';

  // For lazy-loaded images, use data-src instead of src to prevent loading until needed
  const srcAttr = shouldEagerLoad ? `src="${thumbPath}"` : `data-src="${thumbPath}"`;
  const placeholderSrc = shouldEagerLoad ? '' : ' src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'300\'%3E%3C/svg%3E"';

  return `<div class="card game-card" data-index="${idx}" data-folder="${game.folder}" data-name="${game.name.toLowerCase()}" onclick="window.location.href='/${game.folder}.html'">
    <div class="thumb-container" style="--thumb-url: url('${thumbPath}')">
      <img class="thumb" ${srcAttr}${placeholderSrc} alt="${game.name}" loading="${loadingAttr}" decoding="async" width="300" height="300"${fetchPriorityAttr}>
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
