const { generateGameCard, generateAdTile } = require('./cardGenerator');

// Ad tile configuration
// First ad appears at position 14 (3rd row, 2nd tile at 6 columns)
// Then every 20 game tiles after that
const AD_FIRST_POSITION = 13; // 0-indexed (position 14 in 1-indexed)
const AD_INTERVAL = 20; // Insert ad every 20 game tiles after first

/**
 * Check if an ad should be inserted after a given game index
 * @param {number} gameIndex - The 0-indexed position in the game list
 * @returns {boolean} Whether an ad should be inserted after this game
 */
function shouldInsertAdAfter(gameIndex) {
  if (gameIndex < AD_FIRST_POSITION - 1) return false;
  // First ad after index 12 (13th game, position 14)
  // Then after index 32, 52, 72, etc.
  const positionFromFirst = gameIndex - (AD_FIRST_POSITION - 1);
  return positionFromFirst >= 0 && positionFromFirst % AD_INTERVAL === 0;
}
const { generateIndexMetaTags, generateIndexStructuredData } = require('../utils/seoBuilder');
const { generateAnalyticsScript } = require('../utils/analyticsEnhanced');
const { escapeHtml, escapeHtmlAttr } = require('../utils/htmlEscape');
const { getThumbPath } = require('../utils/assetManager');
const { INITIAL_ROWS, ROWS_PER_LOAD, SCROLL_THRESHOLD, EAGER_LOAD_CARDS } = require('../utils/constants');

// Category to icon mapping (kept for sidebar)
const categoryIcons = {
  'Home': '🏠',
  'All Games': '🎮',
  'Trending Games': '🔥',
  'Newly Added': '✨',
  'Action': '⚔️',
  'Puzzle': '🧩',
  'Shooter': '🔫',
  'Clickers': '👆',
  'Horror': '👻',
  'Racing': '🏎️',
  'Adventure': '🗺️',
  'Sports': '⚽',
  'Strategy': '♟️',
  'Platformer': '🏃',
  'RPG': '🎭',
  'Simulation': '🎯',
  'Multiplayer': '👥',
  'Arcade': '🕹️',
  'Fighting': '🥊',
  'Rhythm': '🎵',
  'Music': '🎶',
  'Building': '🏗️',
  'Survival': '🏕️',
  'Roguelike': '💀',
  'Retro': '👾',
  '2 Player': '👫',
  'Football': '🏈',
  'Basketball': '🏀',
  'Card': '🃏',
  'IO': '🌐',
  'Uncategorized': '📁'
};

// Get icon for a category, with fallback
function getCategoryIcon(category) {
  return categoryIcons[category] || '🎯';
}

/**
 * Seeded random number generator for consistent shuffling
 * Uses a simple LCG (Linear Congruential Generator)
 */
function seededRandom(seed) {
  let state = seed;
  return function() {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/**
 * Shuffle array using Fisher-Yates with seeded random
 * @param {Array} array - Array to shuffle
 * @param {number} seed - Random seed
 * @returns {Array} Shuffled array (new array, doesn't mutate original)
 */
function shuffleArray(array, seed) {
  const shuffled = [...array];
  const random = seededRandom(seed);

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

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
    .filter(cat => cat !== "Recently Played" && cat !== "Trending Games" && cat !== "Newly Added")
    .sort((a, b) => categories[b].length - categories[a].length)
    .map(cat => {
      const escapedCat = escapeHtmlAttr(cat);
      const escapedCatText = escapeHtml(cat);
      return `<li role="menuitem" tabindex="0" onclick="filterCategory('${escapedCat}')" onkeypress="if(event.key==='Enter')filterCategory('${escapedCat}')"><span class="icon">${getCategoryIcon(cat)}</span><span class="text">${escapedCatText}</span></li>`;
    })
    .join("");

  // Use current date as seed for daily randomization
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

  // Shuffle all games with seeded random for consistent daily order
  const shuffledGames = shuffleArray(games, seed);

  // Calculate how many games to render initially (INITIAL_ROWS * 6 columns)
  const columnsPerRow = 6;
  const initialGameCount = INITIAL_ROWS * columnsPerRow;
  const initialGames = shuffledGames.slice(0, initialGameCount);

  // Prepare game data for client-side lazy loading
  // Only include necessary fields to minimize payload
  const gameDataForClient = shuffledGames.map(game => {
    const thumbInfo = getThumbPath(game, gamesDir);
    return {
      n: game.name,                    // name
      f: game.folder,                  // folder
      t: thumbInfo.path,               // thumbnail path
      a: game.otherNames || [],        // aliases for search
      c: game.categories || []         // categories for filtering
    };
  });

  // Generate initial game cards HTML with ad tiles
  let adCount = 0;
  let initialCardsHTML = '';
  initialGames.forEach((game, idx) => {
    initialCardsHTML += generateGameCard(game, idx, gamesDir, true);
    // Check if we should insert an ad tile after this game
    if (shouldInsertAdAfter(idx)) {
      initialCardsHTML += generateAdTile(adCount);
      adCount++;
    }
  });

  // Get SEO meta tags and structured data
  const metaTags = generateIndexMetaTags();
  const structuredData = generateIndexStructuredData(games);

  // Full HTML template
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Resource Hints for Performance -->
  <link rel="dns-prefetch" href="https://www.googletagmanager.com">
  <link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>
  <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com">
  <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossorigin>

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

  <!-- Google AdSense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1033412505744705" crossorigin="anonymous"></script>

  ${generateAnalyticsScript()}

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
      <li role="menuitem" tabindex="0" onclick="window.location.href='/'" onkeypress="if(event.key==='Enter')window.location.href='/'"><span class="icon">🏠</span><span class="text">Home</span></li>
      ${sidebarCategories}
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
            <img id="startThumb" src="" alt="Game Thumbnail" width="300" height="300" loading="eager">
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

      <!-- All Games Grid -->
      <div class="category" data-category="All Games" id="allGamesSection">
        <h2>All Games</h2>
        <div class="grid" id="gamesGrid">
          ${initialCardsHTML}
        </div>
        <div id="loadingIndicator" style="display:none;text-align:center;padding:2rem;">
          <div class="loading-spinner"></div>
        </div>
        <div id="scrollSentinel" style="height:1px;"></div>
      </div>

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

  <!-- Game Data for Lazy Loading -->
  <script>
    window.__gameData = ${JSON.stringify(gameDataForClient)};
    window.__renderedCount = ${initialGameCount};
    window.__rowsPerLoad = ${ROWS_PER_LOAD};
    window.__scrollThreshold = ${SCROLL_THRESHOLD};
    // Ad tile configuration
    window.__adFirstPosition = ${AD_FIRST_POSITION};
    window.__adInterval = ${AD_INTERVAL};
    window.__adCount = ${adCount};
  </script>

  <!-- Initialize AdSense Ads -->
  <script>
    (function() {
      // Initialize all existing ad tiles
      var ads = document.querySelectorAll('.ad-tile ins.adsbygoogle');
      for (var i = 0; i < ads.length; i++) {
        try {
          (adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {}
      }
    })();
  </script>

  <script>
    ${clientJS}
  </script>

  <!-- Track Homepage View -->
  <script>
    // Track the homepage visit with enhanced analytics
    if (typeof trackEnhancedPageView !== 'undefined') {
      trackEnhancedPageView('homepage', 'Home', {
        total_games: ${games.length},
        categories_count: ${Object.keys(categories).length}
      });
    }

    // Track category navigation
    const originalFilterCategory = window.filterCategory;
    if (originalFilterCategory) {
      window.filterCategory = function(category) {
        if (typeof gtag !== 'undefined') {
          gtag('event', 'category_navigation', {
            category_name: category,
            session_id: window.analyticsSession ? window.analyticsSession.sessionId : 'unknown',
            timestamp: new Date().toISOString()
          });
        }
        originalFilterCategory(category);
      };
    }

    // Track search interactions
    const originalSearchGames = window.searchGames;
    if (originalSearchGames) {
      let searchTimeout;
      window.searchGames = function(query) {
        // Debounce search tracking
        clearTimeout(searchTimeout);
        if (query && query.length >= 2) {
          searchTimeout = setTimeout(function() {
            if (typeof gtag !== 'undefined') {
              gtag('event', 'search', {
                search_term: query,
                session_id: window.analyticsSession ? window.analyticsSession.sessionId : 'unknown',
                timestamp: new Date().toISOString()
              });
            }
          }, 500);
        }
        originalSearchGames(query);
      };
    }
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
