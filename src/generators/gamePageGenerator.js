const { getThumbPath, FALLBACK_THUMBNAIL } = require("../utils/assetManager");
const { generateGameMetaTags, generateGameStructuredData, generateGameSEOTitle, generateGameSEODescription } = require("../utils/seoBuilder");
const { generateAnalyticsScript } = require("../utils/analyticsEnhanced");
const { escapeHtml, escapeHtmlAttr } = require("../utils/htmlEscape");
const { RECOMMENDED_GAMES_COUNT, MAX_RELATED_GAMES, GAME_DURATION_TRACKING_INTERVAL } = require("../utils/constants");

// Ad tile configuration (same as index page)
const AD_FIRST_POSITION = 13; // 0-indexed (position 14 in 1-indexed)
const AD_INTERVAL = 20; // Insert ad every 20 game tiles after first
const TOTAL_GRID_ITEMS = 42; // 7 rows × 6 columns

/**
 * Check if an ad should be inserted after a given game index
 * @param {number} gameIndex - The 0-indexed position in the game list
 * @returns {boolean} Whether an ad should be inserted after this game
 */
function shouldInsertAdAfter(gameIndex) {
  if (gameIndex < AD_FIRST_POSITION - 1) return false;
  const positionFromFirst = gameIndex - (AD_FIRST_POSITION - 1);
  return positionFromFirst >= 0 && positionFromFirst % AD_INTERVAL === 0;
}

/**
 * Calculate how many ads will be inserted for a given number of games
 */
function calculateAdCount(gameCount) {
  let adCount = 0;
  for (let i = 0; i < gameCount; i++) {
    if (shouldInsertAdAfter(i)) adCount++;
  }
  return adCount;
}

/**
 * Calculate how many games needed to fill grid with ads
 * For 42 total items with ads at positions 14 and 34, we need 40 games
 */
function getGamesNeededForGrid() {
  let games = TOTAL_GRID_ITEMS;
  while (games + calculateAdCount(games) > TOTAL_GRID_ITEMS && games > 0) {
    games--;
  }
  return games;
}

const GAMES_FOR_RECOMMENDATIONS = getGamesNeededForGrid(); // Should be 40

/**
 * Generate HTML for an ad tile card (for game page recommendations)
 * @param {number} adIndex - Unique index for this ad tile
 * @returns {string} HTML string for ad tile card
 */
function generateAdTile(adIndex) {
  return `<div class="card ad-tile" data-ad-index="${adIndex}">
    <div class="ad-content">
      <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="ca-pub-1033412505744705"
        data-ad-slot="1961978889"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
    </div>
  </div>`;
}

// Helper to escape JavaScript string for use in HTML script tags
function escapeJs(str) {
  if (str == null) return '';
  if (typeof str !== 'string') str = String(str);
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Generate HTML for an individual game page
 * @param {Object} game - Game object with properties: name, folder, categories, thumbs
 * @param {Array} allGames - Array of all games for recommendations
 * @param {Object} categories - Categories object (for context, not directly used)
 * @param {string} gamePageStyles - CSS styles string for game page
 * @param {string} gamesDir - Path to games directory
 * @returns {string} Complete HTML document for game page
 */
function generateGamePage(game, allGames, categories, gamePageStyles, gamesDir) {
  const thumbInfo = getThumbPath(game, gamesDir);
  const thumbPath = thumbInfo.path;
  const gameUrl = `games/${game.folder}/index.html`;
  const categoryList = game.categories.join(", ");
  
  // Escape game data for safe HTML insertion
  const escapedGameName = escapeHtml(game.name);
  const escapedGameNameAttr = escapeHtmlAttr(game.name);
  const escapedGameFolder = escapeHtmlAttr(game.folder);
  const escapedCategoryList = escapeHtml(categoryList);
  const escapedCategoryListJs = escapeJs(categoryList);

  // Get similar games for "You Might Also Like" section (no duplicates)
  // Shuffle only if SHUFFLE_RECOMMENDATIONS env var is set (for manual builds)
  const shouldShuffle = process.env.SHUFFLE_RECOMMENDATIONS === 'true';

  const sameCategory = allGames.filter((g) =>
    g.folder !== game.folder &&
    g.categories.some((cat) => game.categories.includes(cat))
  );

  // Sort by name for stable order, or shuffle for manual builds
  if (shouldShuffle) {
    sameCategory.sort(() => Math.random() - 0.5);
  } else {
    sameCategory.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Get other games, excluding same-category games
  const sameCategoryFolders = new Set(sameCategory.map(g => g.folder));
  const otherGames = allGames.filter((g) =>
    g.folder !== game.folder &&
    !sameCategoryFolders.has(g.folder)
  );

  if (shouldShuffle) {
    otherGames.sort(() => Math.random() - 0.5);
  } else {
    otherGames.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Build recommendations: first related games, then fill with other games
  // Use GAMES_FOR_RECOMMENDATIONS to account for ad tiles (40 games + 2 ads = 42 items)
  const recommendations = [];

  // Add related games first (up to MAX_RELATED_GAMES)
  const relatedToAdd = sameCategory.slice(0, MAX_RELATED_GAMES);
  recommendations.push(...relatedToAdd);

  // Fill remaining slots with other games
  const remainingSlots = GAMES_FOR_RECOMMENDATIONS - recommendations.length;
  const othersToAdd = otherGames.slice(0, remainingSlots);
  recommendations.push(...othersToAdd);

  // If we still need more games, add more from same category
  if (recommendations.length < GAMES_FOR_RECOMMENDATIONS && sameCategory.length > MAX_RELATED_GAMES) {
    const moreRelated = sameCategory.slice(MAX_RELATED_GAMES, MAX_RELATED_GAMES + (GAMES_FOR_RECOMMENDATIONS - recommendations.length));
    recommendations.push(...moreRelated);
  }

  // Generate recommended games HTML with ad tiles
  let adCount = 0;
  let recommendedGamesHTML = '';
  recommendations.forEach((g, idx) => {
    const gThumbInfo = getThumbPath(g, gamesDir);
    const gThumbPath = gThumbInfo.path;
    const escapedFolder = escapeHtmlAttr(g.folder);
    const escapedThumbPath = escapeHtmlAttr(gThumbPath);
    const escapedName = escapeHtmlAttr(g.name);
    const escapedNameText = escapeHtml(g.name);
    // SEO-optimized alt text with keywords
    const altText = `Play ${escapedNameText} Unblocked - Free Online Game`;
    recommendedGamesHTML += `<a href="/${escapedFolder}.html" class="game-card" title="Play ${escapedNameText} Unblocked Free Online">
      <div class="thumb-container" style="--thumb-url: url('${escapedThumbPath}')">
        <img class="thumb" src="${escapedThumbPath}" alt="${altText}" loading="lazy" width="300" height="300">
      </div>
      <div class="card-title">${escapedNameText}</div>
    </a>`;

    // Check if we should insert an ad tile after this game
    if (shouldInsertAdAfter(idx)) {
      recommendedGamesHTML += generateAdTile(adCount);
      adCount++;
    }
  });

  // Get SEO meta tags and structured data
  const metaTags = generateGameMetaTags(game, thumbPath);
  const structuredData = generateGameStructuredData(game, thumbPath);

  // Generate SEO description for the game
  const seoDescription = generateGameSEODescription(game);
  const categoryText = game.categories.length > 0 ? game.categories[0].toLowerCase() : 'action';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Resource Hints for Performance -->
  <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com">
  <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossorigin>

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

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&display=swap" rel="stylesheet">

  <style>
    ${gamePageStyles}
  </style>
</head>
<body>
  <!-- Header with Logo -->
  <header>
    <div class="header-left">
      <img src="assets/logo.webp" alt="Chromebook Unlocked Games - Free Unblocked Games for School" class="header-logo" onclick="window.location.href='/'" width="40" height="40" loading="eager" fetchpriority="high">
      <h1 onclick="window.location.href='/'">Chromebook Unlocked Games</h1>
    </div>
  </header>

  <!-- Back Button (fixed to left edge of screen) -->
  <button class="back-button" onclick="goBack()" title="Back to Unblocked Games" aria-label="Back to Free Unblocked Games">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
  </button>

  <script>
    function goBack() {
      // Check if there's a previous page in history from the same site
      if (document.referrer && document.referrer.includes(window.location.host)) {
        history.back();
      } else {
        window.location.href = '/';
      }
    }
  </script>

  <!-- Main Game Content -->
  <main itemscope itemtype="https://schema.org/VideoGame">
    <meta itemprop="name" content="${escapedGameNameAttr}">
    <meta itemprop="gamePlatform" content="Web Browser">
    <meta itemprop="applicationCategory" content="Game">

    <!-- Game Viewer -->
    <div class="game-container">
      <div class="game-frame-wrapper" id="gameWrapper">
        <!-- Controls Bar (sticky to top of game) -->
        <div class="controls">
          <button id="fullscreenBtn" class="icon-btn" onclick="toggleFullscreen()" title="Play ${escapedGameNameAttr} Fullscreen" aria-label="Toggle Fullscreen Mode">
            <svg id="fullscreenIcon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
          </button>
        </div>

        <div class="play-overlay" id="playOverlay">
          <img src="${escapeHtmlAttr(thumbPath)}" alt="Play ${escapedGameNameAttr} Unblocked - Free Online ${escapeHtmlAttr(categoryText)} Game" itemprop="image" width="300" height="300" loading="eager" fetchpriority="high">
          <h2 itemprop="headline">${escapedGameName}</h2>
          <button class="play-btn" onclick="startGame(); gtag('event', 'play_button_clicked', {game_name: '${escapeJs(game.name)}', game_folder: '${escapeJs(game.folder)}'});" aria-label="Play ${escapedGameNameAttr} Free Online">▶ Play</button>
        </div>
        <iframe
          id="gameFrame"
          src=""
          title="${escapedGameNameAttr} Unblocked - Play Free Online Game at School"
          allow="fullscreen; autoplay; encrypted-media"
          allowfullscreen
          tabindex="0">
        </iframe>
      </div>
    </div>
  </main>

  <!-- More Games Hint Box -->
  <div class="more-games-hint" id="moreGamesHint" onclick="scrollToMoreGames()" role="button" aria-label="Scroll to more games" tabindex="0">
    <span class="more-games-hint-text">More Games</span>
    <svg class="more-games-hint-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  </div>

  <!-- More Games Section -->
  <section class="recommendations" id="moreGamesSection" aria-label="More Unblocked Games">
    <div class="section-divider"></div>
    <div class="grid">
      ${recommendedGamesHTML}
    </div>
  </section>

  <!-- Category Tags (above About section) -->
  <div class="category-tags-section">
    <div class="category-tags" role="navigation" aria-label="Game Categories">
      ${game.categories
        .map(
          (cat) => {
            const escapedCat = escapeHtmlAttr(cat);
            const escapedCatText = escapeHtml(cat);
            return `<a href="/#/category/${encodeURIComponent(cat)}" class="category-tag" title="Play Free ${escapedCatText} Games Unblocked">${escapedCatText}</a>`;
          }
        )
        .join("")}
    </div>
  </div>

  <!-- Enhanced SEO Section -->
  <section class="game-info-section" id="gameInfoSection" aria-label="About ${escapedGameNameAttr}">
    <div class="game-info-container">
      <div class="info-card full-width">
        <div class="info-card-icon">📝</div>
        <h3>About ${escapedGameName}</h3>
        <div class="description-content">
          <p class="description-preview" itemprop="description">
            ${seoDescription.split('.')[0]}. This free online game is perfect for playing at school on your Chromebook or any computer.
          </p>
          <div class="description-full">
            <p>
              ${seoDescription.substring(seoDescription.indexOf('.') + 1)}
              ${escapedGameName} is one of the best ${escapeHtml(categoryText)} games available on our unblocked games site.
              No downloads needed - just click play and enjoy ${escapedGameName} instantly in your browser!
            </p>
            <p>
              <strong>How to Play:</strong> Click the play button above to start ${escapedGameName}. The game works on all devices including Chromebooks, laptops, and desktop computers.
              Use the fullscreen mode for the best gaming experience! All controls are explained in-game.
              ${escapedGameName} is completely free to play with no registration required.
            </p>
            <div class="game-meta">
              <div class="meta-item">
                <strong>Categories:</strong> ${escapedCategoryList}
              </div>
              <div class="meta-item">
                <strong>Platform:</strong> Web Browser (HTML5)
              </div>
              <div class="meta-item">
                <strong>Status:</strong> Unblocked & Free to Play
              </div>
            </div>
            <div class="keywords-section">
              <strong>Popular Searches:</strong>
              <div class="keywords-list">
                <span class="keyword">${escapedGameName} unblocked</span>
                <span class="keyword">${escapedGameName} online</span>
                <span class="keyword">play ${escapedGameName}</span>
                <span class="keyword">${escapedGameName} free</span>
                <span class="keyword">${escapeHtml(categoryText)} games</span>
                <span class="keyword">unblocked games</span>
                <span class="keyword">chromebook games</span>
              </div>
            </div>
          </div>
        </div>
        <button class="show-more-btn" onclick="toggleGameInfo()" aria-label="Show more information">
          <span class="show-more-text">Show More</span>
          <svg class="show-more-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>
    </div>
  </section>

  <footer>
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
        <a href="#" onclick="event.preventDefault(); if(window.cookieConsent) window.cookieConsent.reset();">Cookie Settings</a>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; ${new Date().getFullYear()} Chromebook Unlocked Games. All rights reserved.</p>
    </div>
  </footer>

  ${structuredData}

  <script>
    let gameStartTime = null;
    let gamePlayDuration = 0;
    let gameDurationInterval = null;

    // Track initial game page view
    if (typeof trackEnhancedPageView !== 'undefined') {
      trackEnhancedPageView('game_page', '${escapeJs(game.name)}', {
        game_name: '${escapeJs(game.name)}',
        game_folder: '${escapeJs(game.folder)}',
        game_categories: '${escapedCategoryListJs}',
        from_page: document.referrer || 'direct'
      });
    }

    function startGame() {
      const overlay = document.getElementById('playOverlay');
      const frame = document.getElementById('gameFrame');

      frame.src = '${gameUrl}';
      frame.classList.add('active');
      overlay.classList.add('hidden');

      // Enable keyboard focus locking
      gameIsActive = true;

      // Focus the game frame after a short delay for iframe to initialize
      setTimeout(focusGameFrame, 100);

      // Track game start time and send analytics event
      gameStartTime = Date.now();
      gamePlayDuration = 0;

      if (typeof gtag !== 'undefined') {
        gtag('event', 'game_started', {
          game_name: '${escapeJs(game.name)}',
          game_folder: '${escapeJs(game.folder)}',
          game_categories: '${escapedCategoryListJs}',
          session_id: window.analyticsSession ? window.analyticsSession.sessionId : 'unknown',
          timestamp: new Date().toISOString()
        });
      }

      // Track game duration every 30 seconds while playing
      if (gameDurationInterval) {
        clearInterval(gameDurationInterval);
      }

      gameDurationInterval = setInterval(function() {
        if (gameStartTime && !document.hidden) {
          const currentDuration = Math.floor((Date.now() - gameStartTime) / 1000);
          gamePlayDuration = currentDuration;

          if (typeof gtag !== 'undefined') {
            gtag('event', 'game_playing', {
              game_name: '${escapeJs(game.name)}',
              game_folder: '${escapeJs(game.folder)}',
              duration_seconds: currentDuration,
              session_id: window.analyticsSession ? window.analyticsSession.sessionId : 'unknown',
              timestamp: new Date().toISOString()
            });
          }
        }
      }, GAME_DURATION_TRACKING_INTERVAL); // Every N milliseconds

      // Track in Recently Played
      saveToRecentlyPlayed();
    }

    function saveToRecentlyPlayed() {
      const gameData = {
        folder: '${escapeJs(game.folder)}',
        name: '${escapeJs(game.name)}',
        thumb: '${escapeJs(thumbPath)}',
        lastPlayed: Date.now()
      };

      let recentlyPlayed = [];
      try {
        recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
      } catch(e) {
        recentlyPlayed = [];
      }

      // Remove existing entry if present
      recentlyPlayed = recentlyPlayed.filter(g => g.folder !== gameData.folder);

      // Add to beginning
      recentlyPlayed.unshift(gameData);

      // Keep max 25
      if (recentlyPlayed.length > 25) {
        recentlyPlayed = recentlyPlayed.slice(0, 25);
      }

      localStorage.setItem('recentlyPlayed', JSON.stringify(recentlyPlayed));
    }

    function toggleFullscreen() {
      const wrapper = document.getElementById('gameWrapper');
      const isEnteringFullscreen = !document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement;

      if (isEnteringFullscreen) {
        // Enter fullscreen
        if (wrapper.requestFullscreen) {
          wrapper.requestFullscreen();
        } else if (wrapper.webkitRequestFullscreen) {
          wrapper.webkitRequestFullscreen();
        } else if (wrapper.mozRequestFullScreen) {
          wrapper.mozRequestFullScreen();
        }

        // Track fullscreen enter
        if (typeof gtag !== 'undefined') {
          gtag('event', 'fullscreen_enter', {
            game_name: '${escapeJs(game.name)}',
            game_folder: '${escapeJs(game.folder)}',
            session_id: window.analyticsSession ? window.analyticsSession.sessionId : 'unknown'
          });
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        }

        // Track fullscreen exit
        if (typeof gtag !== 'undefined') {
          gtag('event', 'fullscreen_exit', {
            game_name: '${escapeJs(game.name)}',
            game_folder: '${escapeJs(game.folder)}',
            session_id: window.analyticsSession ? window.analyticsSession.sessionId : 'unknown'
          });
        }
      }
    }

    function updateFullscreenIcon() {
      const icon = document.getElementById('fullscreenIcon');
      const btn = document.getElementById('fullscreenBtn');

      if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement) {
        // In fullscreen - show X icon
        icon.innerHTML = '<path d="M18 6L6 18M6 6l12 12"/>';
        btn.title = 'Exit Fullscreen';
        btn.setAttribute('aria-label', 'Exit Fullscreen');
      } else {
        // Not in fullscreen - show expand icon
        icon.innerHTML = '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>';
        btn.title = 'Fullscreen';
        btn.setAttribute('aria-label', 'Toggle Fullscreen');
      }
    }

    // ========================================
    // KEYBOARD FOCUS LOCKING FOR GAME IFRAME
    // ========================================
    // Ensures keyboard input always goes to the game, not the page

    let gameIsActive = false;

    // Focus the game iframe to capture keyboard input
    function focusGameFrame() {
      const frame = document.getElementById('gameFrame');
      if (frame && gameIsActive) {
        // Focus the iframe itself
        frame.focus();

        // Also try to focus content inside iframe (if same-origin)
        try {
          if (frame.contentWindow) {
            frame.contentWindow.focus();
          }
        } catch (e) {
          // Cross-origin iframe - can't access contentWindow, but iframe.focus() still works
        }
      }
    }

    // Prevent all game-related keys from affecting the page while game is active
    window.addEventListener('keydown', (e) => {
      if (!gameIsActive) return;

      // Block these keys from affecting the page (scrolling, navigation, etc.)
      const blockedKeys = [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',  // Arrow keys
        ' ', 'Space',  // Spacebar (page scroll)
        'Tab',  // Tab navigation (keep focus in game)
        'Enter',  // Prevent form submissions
        'Escape',  // Keep in game (fullscreen exit handled separately)
        'w', 'W', 'a', 'A', 's', 'S', 'd', 'D',  // WASD movement
        'q', 'Q', 'e', 'E', 'r', 'R', 'f', 'F',  // Common game keys
        'Shift', 'Control', 'Alt',  // Modifier keys
        '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',  // Number keys
        'z', 'Z', 'x', 'X', 'c', 'C', 'v', 'V',  // Common action keys
        'p', 'P', 'm', 'M', 'i', 'I',  // Pause, mute, inventory
      ];

      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        // Re-focus the game frame to ensure key goes to game
        focusGameFrame();
      }
    }, true);  // Use capture phase to intercept before other handlers

    // Also block keyup to prevent any residual page interactions
    window.addEventListener('keyup', (e) => {
      if (!gameIsActive) return;

      const blockedKeys = [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        ' ', 'Space', 'Tab', 'Enter',
        'w', 'W', 'a', 'A', 's', 'S', 'd', 'D',
        'q', 'Q', 'e', 'E', 'r', 'R', 'f', 'F',
        'Shift', 'Control', 'Alt',
        '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
        'z', 'Z', 'x', 'X', 'c', 'C', 'v', 'V',
        'p', 'P', 'm', 'M', 'i', 'I',
      ];

      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    // Re-focus game frame when clicking on the game wrapper area
    document.getElementById('gameWrapper').addEventListener('click', () => {
      if (gameIsActive) {
        focusGameFrame();
      }
    });

    // Re-focus game frame after fullscreen changes
    function handleFullscreenChange() {
      updateFullscreenIcon();

      // Re-focus game after fullscreen transition completes
      if (gameIsActive) {
        setTimeout(focusGameFrame, 150);
      }
    }

    // Listen for fullscreen changes (also updates icon and re-focuses game)
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Re-focus game after clicking fullscreen button
    document.getElementById('fullscreenBtn').addEventListener('click', () => {
      if (gameIsActive) {
        setTimeout(focusGameFrame, 200);
      }
    });

    // When iframe loads, focus it
    document.getElementById('gameFrame').addEventListener('load', () => {
      if (gameIsActive) {
        focusGameFrame();
      }
    });

    // More Games Hint Box - Scroll behavior and click handler
    function scrollToMoreGames() {
      const moreGamesSection = document.getElementById('moreGamesSection');
      if (moreGamesSection) {
        moreGamesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Track analytics
        if (typeof gtag !== 'undefined') {
          gtag('event', 'more_games_hint_clicked', {
            game_name: '${escapeJs(game.name)}',
            game_folder: '${escapeJs(game.folder)}',
            session_id: window.analyticsSession ? window.analyticsSession.sessionId : 'unknown'
          });
        }
      }
    }

    // Handle keyboard accessibility for More Games hint
    document.getElementById('moreGamesHint').addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        scrollToMoreGames();
      }
    });

    // Scroll listener to hide/show More Games hint
    (function() {
      const moreGamesHint = document.getElementById('moreGamesHint');
      const moreGamesSection = document.getElementById('moreGamesSection');
      let ticking = false;

      function updateHintVisibility() {
        if (!moreGamesHint || !moreGamesSection) return;

        const sectionRect = moreGamesSection.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        // Hide hint when the More Games section is visible in viewport
        // (when top of section is within 200px of viewport bottom or already visible)
        if (sectionRect.top < viewportHeight - 100) {
          moreGamesHint.classList.add('hidden');
        } else {
          moreGamesHint.classList.remove('hidden');
        }

        ticking = false;
      }

      window.addEventListener('scroll', function() {
        if (!ticking) {
          window.requestAnimationFrame(updateHintVisibility);
          ticking = true;
        }
      }, { passive: true });

      // Initial check
      updateHintVisibility();
    })();

    // Toggle game info section
    function toggleGameInfo() {
      const section = document.getElementById('gameInfoSection');
      const btn = document.querySelector('.show-more-btn');
      const btnText = btn.querySelector('.show-more-text');
      const btnIcon = btn.querySelector('.show-more-icon');

      if (section.classList.contains('expanded')) {
        section.classList.remove('expanded');
        btnText.textContent = 'Show More';
        btnIcon.style.transform = 'rotate(0deg)';
        section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Track collapse
        if (typeof gtag !== 'undefined') {
          gtag('event', 'game_info_collapse', {
            game_name: '${escapeJs(game.name)}',
            game_folder: '${escapeJs(game.folder)}',
            session_id: window.analyticsSession ? window.analyticsSession.sessionId : 'unknown'
          });
        }
      } else {
        section.classList.add('expanded');
        btnText.textContent = 'Show Less';
        btnIcon.style.transform = 'rotate(180deg)';

        // Track expand
        if (typeof gtag !== 'undefined') {
          gtag('event', 'game_info_expand', {
            game_name: '${escapeJs(game.name)}',
            game_folder: '${escapeJs(game.folder)}',
            session_id: window.analyticsSession ? window.analyticsSession.sessionId : 'unknown'
          });
        }
      }
    }

    // Track game session end when user leaves the page
    window.addEventListener('beforeunload', () => {
      // Clear duration tracking interval
      if (gameDurationInterval) {
        clearInterval(gameDurationInterval);
      }

      if (gameStartTime) {
        const playDuration = Math.round((Date.now() - gameStartTime) / 1000);

        if (typeof gtag !== 'undefined') {
          gtag('event', 'game_session_end', {
            game_name: '${escapeJs(game.name)}',
            game_folder: '${escapeJs(game.folder)}',
            game_categories: '${escapedCategoryListJs}',
            duration_seconds: playDuration,
            session_id: window.analyticsSession ? window.analyticsSession.sessionId : 'unknown',
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    // Track visibility changes (when user switches tabs while game is running)
    document.addEventListener('visibilitychange', function() {
      if (gameStartTime) {
        if (document.hidden) {
          // User switched away - pause duration tracking
          if (gameDurationInterval) {
            clearInterval(gameDurationInterval);
          }

          if (typeof gtag !== 'undefined') {
            const currentDuration = Math.floor((Date.now() - gameStartTime) / 1000);
            gtag('event', 'game_paused', {
              game_name: '${game.name}',
              game_folder: '${game.folder}',
              duration_seconds: currentDuration,
              session_id: window.analyticsSession ? window.analyticsSession.sessionId : 'unknown'
            });
          }
        } else {
          // User returned - resume duration tracking
          if (typeof gtag !== 'undefined') {
            const currentDuration = Math.floor((Date.now() - gameStartTime) / 1000);
            gtag('event', 'game_resumed', {
              game_name: '${game.name}',
              game_folder: '${game.folder}',
              duration_seconds: currentDuration,
              session_id: window.analyticsSession ? window.analyticsSession.sessionId : 'unknown'
            });
          }

          // Restart the duration tracking interval
          if (gameDurationInterval) {
            clearInterval(gameDurationInterval);
          }

          gameDurationInterval = setInterval(function() {
            if (gameStartTime && !document.hidden) {
              const currentDuration = Math.floor((Date.now() - gameStartTime) / 1000);
              gamePlayDuration = currentDuration;

              if (typeof gtag !== 'undefined') {
                gtag('event', 'game_playing', {
                  game_name: '${game.name}',
                  game_folder: '${game.folder}',
                  duration_seconds: currentDuration,
                  session_id: window.analyticsSession ? window.analyticsSession.sessionId : 'unknown',
                  timestamp: new Date().toISOString()
                });
              }
            }
          }, 30000);
        }
      }
    });
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

  <!-- Cookie Consent Banner -->
  <link rel="stylesheet" href="assets/cookie-consent.css">
  <script src="assets/cookie-consent.js"></script>
</body>
</html>`;
}

module.exports = {
  generateGamePage,
};
