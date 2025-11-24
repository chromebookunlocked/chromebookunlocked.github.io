const { generateGameCard } = require('./cardGenerator');
const { generateIndexMetaTags, generateIndexStructuredData } = require('../utils/seoBuilder');

/**
 * Generate the full HTML for the index page
 * @param {Array} games - Array of game objects
 * @param {Object} categories - Object with category keys and game arrays
 * @param {string} mainStyles - CSS content string to embed in <style> tag
 * @param {string} clientJS - JavaScript content string to embed in <script> tag
 * @param {string} gamesDir - Optional path to games directory (for asset resolution)
 * @returns {string} Complete HTML document
 */
function generateIndexHTML(games, categories, mainStyles, clientJS, gamesDir = '.') {
  // Generate sidebar categories
  const sidebarCategories = Object.keys(categories)
    .filter(cat => cat !== "Recently Played" && cat !== "Newly Added")
    .map(cat => `<li role="menuitem" tabindex="0" onclick="filterCategory('${cat}')" onkeypress="if(event.key==='Enter')filterCategory('${cat}')">${cat}</li>`)
    .join("");

  // Add "Newly Added" at the top if it exists
  const newlyAddedItem = categories['Newly Added'] ?
    `<li role="menuitem" tabindex="0" onclick="filterCategory('Newly Added')" onkeypress="if(event.key==='Enter')filterCategory('Newly Added')" style="border-bottom: 1px solid rgba(255,102,255,0.3); padding-bottom: 0.8rem; margin-bottom: 0.8rem;">✨ Newly Added</li>` : '';

  const finalSidebarCategories = newlyAddedItem + sidebarCategories;

  // Generate category sections with games
  const categorySections = Object.keys(categories)
    .sort((a, b) => {
      // Keep "Newly Added" at top, sort rest by game count
      if (a === "Newly Added") return -1;
      if (b === "Newly Added") return 1;
      return categories[b].length - categories[a].length;
    })
    .map(cat => {
      const list = categories[cat];
      return `<div class="category" data-category="${cat}">
          <h2>${cat}</h2>
          <div class="grid">
            ${list.map((g, i) => generateGameCard(g, i, gamesDir)).join('')}
          </div>
        </div>`;
    }).join('');

  // Get SEO meta tags and structured data (pass games array for accurate count)
  const metaTags = generateIndexMetaTags();
  const structuredData = generateIndexStructuredData(games);

  // Full HTML template
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  ${metaTags}

  <!-- Structured Data for Search Engines -->
  ${structuredData}

  <style>
    ${mainStyles}
  </style>
</head>
<body>

  <!-- Skip to main content link for accessibility -->
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <!-- Sidebar -->
  <nav id="sidebar" role="navigation" aria-label="Game categories">
    <ul id="categoryList" role="menu">
      <li role="menuitem" tabindex="0" onclick="filterCategory('Home')" onkeypress="if(event.key==='Enter')filterCategory('Home')">Home</li>
      <li role="menuitem" tabindex="0" onclick="filterCategory('All Games')" onkeypress="if(event.key==='Enter')filterCategory('All Games')">All Games</li>
      ${finalSidebarCategories}
    </ul>
  </nav>
  <div id="sidebarIndicator" aria-hidden="true"></div>

  <!-- Content -->
  <div id="content" role="main">
    <!-- Top Header with Search -->
    <header id="topHeader">
      <div class="header-left">
        <img src="assets/logo.png" alt="Chromebook Unlocked Games Logo" class="header-logo" onclick="window.location.href='index.html'">
        <h1 onclick="window.location.href='index.html'">Chromebook Unlocked Games</h1>
      </div>
      <div id="searchContainer" role="search">
        <span id="searchIcon" aria-hidden="true">🔍</span>
        <input type="text" id="searchBar" placeholder="Search games..." oninput="searchGames(this.value)" aria-label="Search for games" autocomplete="off">
        <div id="searchDropdown" role="listbox" aria-label="Search results"></div>
      </div>
    </header>

    <div class="content-wrapper" id="main-content">
      <div id="controls">
        <button id="backBtn" onclick="closeGame()" aria-label="Go back to game list">← Back</button>
        <span id="gameTitle" role="heading" aria-level="2"></span>
        <button id="fullscreenBtn" onclick="toggleFullscreen()" aria-label="Toggle fullscreen mode">⛶ Fullscreen</button>
      </div>

      <div class="viewer-wrapper">
        <!-- Left Banner Ad -->
        <div class="ad-banner-container ad-banner-left">
          <div class="ad-banner-placeholder">
            Advertisement
          </div>
        </div>

        <!-- Game Viewer -->
        <div class="viewer" id="viewer">
          <div id="startOverlay">
            <img id="startThumb" src="" alt="Game Thumbnail">
            <h1 id="startName"></h1>
            <button id="startButton" onclick="startGame()">▶ Play</button>
          </div>
          <iframe id="gameFrame" src="" scrolling="no"></iframe>
        </div>

        <!-- Right Banner Ad -->
        <div class="ad-banner-container ad-banner-right">
          <div class="ad-banner-placeholder">
            Advertisement
          </div>
        </div>
      </div>

      <!-- All Games section (all games without categories) -->
      <div class="category" data-category="All Games" style="display:none;">
        <h2>All Games</h2>
        <div class="grid">
          ${games.map((g, i) => generateGameCard(g, i, gamesDir)).join('')}
        </div>
      </div>

      <!-- Recently Played -->
      <div class="category" data-category="Recently Played" id="recentlyPlayedSection" style="display:none;">
        <h2>Recently Played</h2>
        <div class="grid" id="recentlyPlayedGrid"></div>
      </div>

      <!-- All category sections (including games for home view) -->
      ${categorySections}

      <a href="dmca.html" id="dmcaLink" target="_blank">DMCA</a>
    </div>
  </div>

  <script>
    ${clientJS}
  </script>
</body>
</html>`;

  return html;
}

module.exports = {
  generateIndexHTML
};
