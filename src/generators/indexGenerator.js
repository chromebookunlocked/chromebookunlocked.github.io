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
  // Generate sidebar categories - sorted by game count (largest first)
  const sidebarCategories = Object.keys(categories)
    .filter(cat => cat !== "Recently Played" && cat !== "Trending Games")
    .sort((a, b) => categories[b].length - categories[a].length) // Sort by count, largest first
    .map(cat => `<li role="menuitem" tabindex="0" onclick="filterCategory('${cat}')" onkeypress="if(event.key==='Enter')filterCategory('${cat}')">${cat}</li>`)
    .join("");

  const finalSidebarCategories = sidebarCategories;

  // Generate category sections with games - hide categories with less than 4 games on homepage
  const sortedCategories = Object.keys(categories)
    .sort((a, b) => categories[b].length - categories[a].length); // Sort by game count

  const categorySections = sortedCategories
    .map((cat, catIndex) => {
      const list = categories[cat];
      // Hide all category sections on home page by default
      const hideOnHome = ' data-hide-on-home="true" style="display:none;"';
      // Eagerly load first 4 of each category to ensure first row is ready when category is selected
      return `<div class="category" data-category="${cat}"${hideOnHome}>
          <h2>${cat}</h2>
          <div class="grid">
            ${list.map((g, i) => generateGameCard(g, i, gamesDir, true)).join('')}
          </div>
        </div>`;
    }).join('');

  // Get SEO meta tags and structured data (pass games for ItemList schema)
  const metaTags = generateIndexMetaTags();
  const structuredData = generateIndexStructuredData(games);

  // Full HTML template
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Resource Hints for Performance -->
  <link rel="dns-prefetch" href="https://www.googletagmanager.com">
  <link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>

  <!-- Optimize Google Fonts loading -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap"></noscript>

  <!-- Preload critical assets -->
  <link rel="preload" as="image" href="assets/logo.webp" fetchpriority="high">

  <!-- Redirect /index.html to / -->
  <script>
    if (window.location.pathname === '/index.html') {
      window.location.replace('/' + window.location.hash);
    }
  </script>

  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-4QZLTDX504"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'G-4QZLTDX504');
  </script>

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
      <li role="menuitem" tabindex="0" onclick="filterCategory('Trending Games')" onkeypress="if(event.key==='Enter')filterCategory('Trending Games')">Trending Games</li>
      ${finalSidebarCategories}
    </ul>
  </nav>
  <div id="sidebarIndicator" aria-hidden="true"></div>

  <!-- Content -->
  <div id="content" role="main">
    <!-- Top Header with Search -->
    <header id="topHeader">
      <div class="header-left">
        <img src="assets/logo.webp" alt="Chromebook Unlocked Games Logo" class="header-logo" onclick="window.location.href='/'" width="48" height="48" fetchpriority="high">
        <h1 onclick="window.location.href='/'">Chromebook Unlocked Games</h1>
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
          ${games.sort((a, b) => {
            // Sort trending games first
            const aIsTrending = (a.category || '').includes('Trending Games');
            const bIsTrending = (b.category || '').includes('Trending Games');
            if (aIsTrending && !bIsTrending) return -1;
            if (!aIsTrending && bIsTrending) return 1;
            return 0; // Keep original order otherwise
          }).map((g, i) => generateGameCard(g, i, gamesDir, false)).join('')}
        </div>
      </div>

      <!-- Recently Played -->
      <div class="category" data-category="Recently Played" id="recentlyPlayedSection" style="display:none;">
        <h2>Recently Played</h2>
        <div class="grid" id="recentlyPlayedGrid"></div>
      </div>

      <!-- Load Recently Played Games Synchronously to Prevent Layout Shift -->
      <script>
        (function() {
          const MAX_RECENT = 25;
          const recentSection = document.getElementById('recentlyPlayedSection');
          const recentGrid = document.getElementById('recentlyPlayedGrid');

          if (!recentGrid) return;

          // Get all valid game folders from pre-rendered game cards
          function getValidGameFolders() {
            const folders = new Set();
            document.querySelectorAll('.game-card[data-folder]').forEach(card => {
              folders.add(card.getAttribute('data-folder'));
            });
            return folders;
          }

          // Clean recently played list
          let list = [];
          try {
            list = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
          } catch(e) {
            list = [];
          }

          if (list.length === 0) {
            return; // Keep section hidden
          }

          // Clean invalid entries
          const validFolders = getValidGameFolders();
          list = list.filter(game => validFolders.has(game.folder));

          // Sort by lastPlayed timestamp (most recent first)
          list.sort((a, b) => {
            const timeA = a.lastPlayed || 0;
            const timeB = b.lastPlayed || 0;
            return timeB - timeA;
          });

          const displayList = list.slice(0, MAX_RECENT);

          // Build cards HTML
          const cardsHTML = displayList.map((g, i) => {
            const thumbUrl = g.thumb || 'assets/logo.webp';
            // Eagerly load first 6 thumbnails, lazy load the rest
            const isFirstRow = i < 6;
            const srcAttr = isFirstRow ? \`src="\${thumbUrl}"\` : \`data-src="\${thumbUrl}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3C/svg%3E"\`;
            const loadingAttr = isFirstRow ? 'eager' : 'lazy';

            return \`<div class="card game-card" data-index="\${i}" data-folder="\${g.folder}" data-name="\${g.name.toLowerCase()}" onclick="window.location.href='/\${g.folder}.html'">
              <div class="thumb-container" style="--thumb-url: url('\${thumbUrl}')">
                <img class="thumb" \${srcAttr} alt="\${g.name}" loading="\${loadingAttr}" decoding="async" width="300" height="300" onerror="this.src='assets/logo.webp'">
              </div>
              <div class="card-title">\${g.name}</div>
            </div>\`;
          }).join('');

          // Set grid content and show section
          if (cardsHTML) {
            recentGrid.innerHTML = cardsHTML;
            if (recentSection) {
              recentSection.style.display = 'block';
            }
            // Mark as loaded for client.js
            window.__recentlyPlayedLoaded = true;
          }
        })();
      </script>

      <!-- All category sections (including games for home view) -->
      ${categorySections}

      <footer id="siteFooter">
        <div class="footer-content">
          <div class="footer-brand">
            <h3>Chromebook Unlocked Games</h3>
            <span class="footer-url">chromebookunlocked.github.io</span>
          </div>
          <div class="footer-links">
            <a href="/important-pages/privacy-policy.html">Privacy Policy</a>
            <a href="/important-pages/cookie-policy.html">Cookie Policy</a>
            <a href="/important-pages/terms-of-service.html">Terms of Service</a>
            <a href="/important-pages/contact.html">Contact</a>
            <a href="/important-pages/dmca.html">DMCA</a>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; ${new Date().getFullYear()} Chromebook Unlocked Games. All rights reserved.</p>
        </div>
      </footer>
    </div>
  </div>

  <script>
    ${clientJS}
  </script>

  <!-- Cookie Consent Banner - Load asynchronously -->
  <link rel="preload" as="style" href="assets/cookie-consent.css" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="assets/cookie-consent.css"></noscript>
  <script src="assets/cookie-consent.js" defer></script>
</body>
</html>`;

  return html;
}

module.exports = {
  generateIndexHTML
};
