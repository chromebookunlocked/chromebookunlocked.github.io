const { getThumbPath } = require("../utils/assetManager");
const { escapeHtml, escapeHtmlAttr } = require("../utils/htmlEscape");
const { EAGER_LOAD_CARDS } = require("../utils/constants");

/**
 * Generate HTML for a single game card
 * @param {Object} game - Game object
 * @param {number} idx - Card index within category
 * @param {string} gamesDir - Path to games directory
 * @param {boolean} loadEagerly - Whether to eagerly load this card's thumbnail
 * @returns {string} HTML string for game card
 */
function generateGameCard(game, idx, gamesDir, loadEagerly = false) {
  const thumbInfo = getThumbPath(game, gamesDir);
  const thumbPath = thumbInfo.path;

  // Eagerly load first N images of each category to ensure first row is ready
  // All other images use data-src and load when they become visible
  const shouldEagerLoad = loadEagerly && idx < EAGER_LOAD_CARDS;
  const loadingAttr = shouldEagerLoad ? 'eager' : 'lazy';
  const fetchPriorityAttr = shouldEagerLoad ? ' fetchpriority="high"' : '';

  // Escape file paths for use in HTML attributes
  const escapedFolder = escapeHtmlAttr(game.folder);
  const escapedThumbPath = escapeHtmlAttr(thumbPath);
  const escapedGameName = escapeHtmlAttr(game.name);
  const escapedGameNameLower = escapeHtml(game.name.toLowerCase());

  // For lazy-loaded images, use data-src instead of src to prevent loading until needed
  const srcAttr = shouldEagerLoad ? `src="${escapedThumbPath}"` : `data-src="${escapedThumbPath}"`;
  const placeholderSrc = shouldEagerLoad ? '' : ' src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'300\'%3E%3C/svg%3E"';

  // Add aliases for search (otherNames) - escape each alias
  const aliasesAttr = game.otherNames && game.otherNames.length > 0
    ? ` data-aliases="${escapeHtmlAttr(game.otherNames.map(n => n.toLowerCase()).join(','))}"`
    : '';

  return `<div class="card game-card" data-index="${idx}" data-folder="${escapedFolder}" data-name="${escapedGameNameLower}"${aliasesAttr} onclick="window.location.href='/${escapedFolder}.html'">
    <div class="thumb-container" style="--thumb-url: url('${escapedThumbPath}')">
      <img class="thumb" ${srcAttr}${placeholderSrc} alt="${escapedGameName}" loading="${loadingAttr}" decoding="async" width="300" height="300"${fetchPriorityAttr}>
    </div>
    <div class="card-title">${escapeHtml(game.name)}</div>
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
    .map(cat => `<button class="sidebar-button" onclick="filterCategory('${escapeHtmlAttr(cat)}')">${escapeHtml(cat)} (${categories[cat].length})</button>`)
    .join('\n');
}

/**
 * Generate HTML for a full-width horizontal ad row
 * @param {number} adIndex - Unique index for this ad
 * @param {boolean} adsEnabled - Whether ads are enabled
 * @returns {string} HTML string for horizontal ad row (empty string if ads disabled)
 */
function generateHorizontalAd(adIndex, adsEnabled = true) {
  if (!adsEnabled) return '';
  return `<div class="horizontal-ad-row" data-ad-index="${adIndex}">
    <ins class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-1033412505744705"
      data-ad-slot="2719401053"
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>
    <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
  </div>`;
}

module.exports = {
  generateGameCard,
  generateSidebar,
  generateHorizontalAd
};
