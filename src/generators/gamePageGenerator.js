const { chooseThumb, getAssetPath } = require("../utils/assetManager");
const { generateGameMetaTags, generateGameStructuredData, generateGameSEOTitle, generateGameSEODescription } = require("../utils/seoBuilder");
const { generateAnalyticsScript } = require("../utils/analyticsEnhanced");

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
  const thumb = chooseThumb(game, gamesDir);
  const gameUrl = `games/${game.folder}/index.html`;
  const categoryList = game.categories.join(", ");
  const thumbPath = getAssetPath(game.folder, thumb);

  // Get similar games for "You Might Also Like" section (no duplicates)
  const sameCategory = allGames.filter((g) =>
    g.folder !== game.folder &&
    g.categories.some((cat) => game.categories.includes(cat))
  );

  // Shuffle same category games
  const shuffledSameCategory = sameCategory.sort(() => Math.random() - 0.5);

  // Get other games, excluding already selected same-category games
  const sameCategoryFolders = new Set(shuffledSameCategory.map(g => g.folder));
  const otherGames = allGames.filter((g) =>
    g.folder !== game.folder &&
    !sameCategoryFolders.has(g.folder)
  );

  // Shuffle other games
  const shuffledOtherGames = otherGames.sort(() => Math.random() - 0.5);

  // New pattern: alternate 1 related, 1 random, until 5 related used or no more available
  // Then fill rest with random games (total 42 games for 7 rows x 6 columns)
  const shuffled = [];
  const maxRelated = Math.min(5, shuffledSameCategory.length);
  let relatedIndex = 0;
  let randomIndex = 0;

  // Alternate pattern: related, random, related, random...
  while (shuffled.length < 42 && (relatedIndex < maxRelated || randomIndex < shuffledOtherGames.length)) {
    // Add related game if available and under limit
    if (relatedIndex < maxRelated && relatedIndex < shuffledSameCategory.length) {
      shuffled.push(shuffledSameCategory[relatedIndex]);
      relatedIndex++;
    }

    // Add random game if available
    if (shuffled.length < 42 && randomIndex < shuffledOtherGames.length) {
      shuffled.push(shuffledOtherGames[randomIndex]);
      randomIndex++;
    }
  }

  // If we still need more games and have more related games available
  while (shuffled.length < 42 && relatedIndex < shuffledSameCategory.length) {
    shuffled.push(shuffledSameCategory[relatedIndex]);
    relatedIndex++;
  }

  // Fill any remaining slots with random games
  while (shuffled.length < 42 && randomIndex < shuffledOtherGames.length) {
    shuffled.push(shuffledOtherGames[randomIndex]);
    randomIndex++;
  }

  const recommendedGamesHTML = shuffled
    .map((g) => {
      const gThumb = chooseThumb(g, gamesDir);
      const gThumbPath = getAssetPath(g.folder, gThumb);
      // SEO-optimized alt text with keywords
      const altText = `Play ${g.name} Unblocked - Free Online Game`;
      return `<a href="/${g.folder}.html" class="game-card" title="Play ${g.name} Unblocked Free Online">
      <div class="thumb-container" style="--thumb-url: url('${gThumbPath}')">
        <img class="thumb" src="${gThumbPath}" alt="${altText}" loading="lazy">
      </div>
      <div class="card-title">${g.name}</div>
    </a>`;
    })
    .join("");

  // Get SEO meta tags and structured data
  const metaTags = generateGameMetaTags(game, thumbPath);
  const structuredData = generateGameStructuredData(game, thumbPath);

  // Generate SEO description for the game
  const seoDescription = generateGameSEODescription(game);
  const categoryText = game.categories.length > 0 ? game.categories[0].toLowerCase() : 'action';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-4QZLTDX504"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'G-4QZLTDX504');
  </script>

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
      <img src="assets/logo.webp" alt="Chromebook Unlocked Games - Free Unblocked Games for School" class="header-logo" onclick="window.location.href='/'">
      <h1 onclick="window.location.href='/'">Chromebook Unlocked Games</h1>
    </div>
  </header>

  <!-- Back Button (fixed to left edge of screen) -->
  <button class="back-button" onclick="window.location.href='/'" title="Back to Unblocked Games" aria-label="Back to Free Unblocked Games">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
  </button>

  <!-- Main Game Content -->
  <main itemscope itemtype="https://schema.org/VideoGame">
    <meta itemprop="name" content="${game.name}">
    <meta itemprop="gamePlatform" content="Web Browser">
    <meta itemprop="applicationCategory" content="Game">

    <!-- Game Viewer -->
    <div class="game-container">
      <div class="game-frame-wrapper" id="gameWrapper">
        <!-- Controls Bar (sticky to top of game) -->
        <div class="controls">
          <button id="fullscreenBtn" class="icon-btn" onclick="toggleFullscreen()" title="Play ${game.name} Fullscreen" aria-label="Toggle Fullscreen Mode">
            <svg id="fullscreenIcon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
          </button>
        </div>

        <div class="play-overlay" id="playOverlay">
          <img src="games/${game.folder}/${thumb}" alt="Play ${game.name} Unblocked - Free Online ${categoryText} Game" itemprop="image">
          <h2 itemprop="headline">${game.name}</h2>
          <button class="play-btn" onclick="startGame(); gtag('event', 'play_button_clicked', {game_name: '${game.name}', game_folder: '${game.folder}'});" aria-label="Play ${game.name} Free Online">▶ Play</button>
        </div>
        <iframe
          id="gameFrame"
          src=""
          title="${game.name} Unblocked - Play Free Online Game at School"
          allow="fullscreen; autoplay; encrypted-media"
          allowfullscreen>
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
          (cat) =>
            `<a href="/#/category/${encodeURIComponent(cat)}" class="category-tag" title="Play Free ${cat} Games Unblocked">${cat}</a>`
        )
        .join("")}
    </div>
  </div>

  <!-- Enhanced SEO Section -->
  <section class="game-info-section" id="gameInfoSection" aria-label="About ${game.name}">
    <div class="game-info-container">
      <div class="info-card full-width">
        <div class="info-card-icon">📝</div>
        <h3>About ${game.name}</h3>
        <div class="description-content">
          <p class="description-preview" itemprop="description">
            ${seoDescription.split('.')[0]}. This free online game is perfect for playing at school on your Chromebook or any computer.
          </p>
          <div class="description-full">
            <p>
              ${seoDescription.substring(seoDescription.indexOf('.') + 1)}
              ${game.name} is one of the best ${categoryText} games available on our unblocked games site.
              No downloads needed - just click play and enjoy ${game.name} instantly in your browser!
            </p>
            <p>
              <strong>How to Play:</strong> Click the play button above to start ${game.name}. The game works on all devices including Chromebooks, laptops, and desktop computers.
              Use the fullscreen mode for the best gaming experience! All controls are explained in-game.
              ${game.name} is completely free to play with no registration required.
            </p>
            <div class="game-meta">
              <div class="meta-item">
                <strong>Categories:</strong> ${categoryList}
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
                <span class="keyword">${game.name} unblocked</span>
                <span class="keyword">${game.name} online</span>
                <span class="keyword">play ${game.name}</span>
                <span class="keyword">${game.name} free</span>
                <span class="keyword">${categoryText} games</span>
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
      trackEnhancedPageView('game_page', '${game.name}', {
        game_name: '${game.name}',
        game_folder: '${game.folder}',
        game_categories: '${categoryList}',
        from_page: document.referrer || 'direct'
      });
    }

    function startGame() {
      const overlay = document.getElementById('playOverlay');
      const frame = document.getElementById('gameFrame');

      frame.src = '${gameUrl}';
      frame.classList.add('active');
      overlay.classList.add('hidden');

      // Track game start time and send analytics event
      gameStartTime = Date.now();
      gamePlayDuration = 0;

      if (typeof gtag !== 'undefined') {
        gtag('event', 'game_started', {
          game_name: '${game.name}',
          game_folder: '${game.folder}',
          game_categories: '${categoryList}',
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
              game_name: '${game.name}',
              game_folder: '${game.folder}',
              duration_seconds: currentDuration,
              session_id: window.analyticsSession ? window.analyticsSession.sessionId : 'unknown',
              timestamp: new Date().toISOString()
            });
          }
        }
      }, 30000); // Every 30 seconds

      // Track in Recently Played
      saveToRecentlyPlayed();
    }

    function saveToRecentlyPlayed() {
      const gameData = {
        folder: '${game.folder}',
        name: '${game.name}',
        thumb: '${thumbPath}',
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
            game_name: '${game.name}',
            game_folder: '${game.folder}',
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
            game_name: '${game.name}',
            game_folder: '${game.folder}',
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

    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', updateFullscreenIcon);
    document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
    document.addEventListener('mozfullscreenchange', updateFullscreenIcon);
    document.addEventListener('MSFullscreenChange', updateFullscreenIcon);

    // Prevent arrow keys from scrolling the page on game pages
    window.addEventListener('keydown', (e) => {
      const blocked = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (blocked.includes(e.key)) {
        e.preventDefault();
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
            game_name: '${game.name}',
            game_folder: '${game.folder}',
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
            game_name: '${game.name}',
            game_folder: '${game.folder}',
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
            game_name: '${game.name}',
            game_folder: '${game.folder}',
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
            game_name: '${game.name}',
            game_folder: '${game.folder}',
            game_categories: '${categoryList}',
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

  <!-- Cookie Consent Banner -->
  <link rel="stylesheet" href="assets/cookie-consent.css">
  <script src="assets/cookie-consent.js"></script>
</body>
</html>`;
}

module.exports = {
  generateGamePage,
};
