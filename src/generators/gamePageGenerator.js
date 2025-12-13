const { chooseThumb, getAssetPath } = require("../utils/assetManager");
const { generateGameMetaTags, generateGameStructuredData, generateGameSEOTitle, generateGameSEODescription } = require("../utils/seoBuilder");

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

  // Combine: prioritize same category, then fill with others to reach 35 games (7 rows x 5 columns)
  const shuffled = [
    ...shuffledSameCategory,
    ...shuffledOtherGames,
  ].slice(0, 35);

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
      <img src="assets/logo.png" alt="Chromebook Unlocked Games - Free Unblocked Games for School" class="header-logo" onclick="window.location.href='/'">
      <h1 onclick="window.location.href='/'">Chromebook Unlocked Games</h1>
    </div>
  </header>

  <!-- Main Game Content -->
  <main itemscope itemtype="https://schema.org/VideoGame">
    <meta itemprop="name" content="${game.name}">
    <meta itemprop="gamePlatform" content="Web Browser">
    <meta itemprop="applicationCategory" content="Game">

    <!-- Game Viewer -->
    <div class="game-container">
      <!-- Back Button (outside game frame) -->
      <button class="back-button" onclick="window.location.href='/'" title="Back to Unblocked Games" aria-label="Back to Free Unblocked Games">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        <span>Back</span>
      </button>

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

      <!-- Category Tags with SEO -->
      <div class="category-tags" role="navigation" aria-label="Game Categories">
        ${game.categories
          .map(
            (cat) =>
              `<a href="/#/category/${encodeURIComponent(cat)}" class="category-tag" title="Play Free ${cat} Games Unblocked">${cat}</a>`
          )
          .join("")}
      </div>
    </div>
  </main>

  <!-- You Might Also Like Section -->
  <section class="recommendations" aria-label="Similar Unblocked Games">
    <h2>You Might Also Like - More Free Unblocked Games</h2>
    <div class="grid">
      ${recommendedGamesHTML}
    </div>
  </section>

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

    function startGame() {
      const overlay = document.getElementById('playOverlay');
      const frame = document.getElementById('gameFrame');

      frame.src = '${gameUrl}';
      frame.classList.add('active');
      overlay.classList.add('hidden');

      // Track game start time and send analytics event
      gameStartTime = Date.now();
      gtag('event', 'game_started', {
        game_name: '${game.name}',
        game_folder: '${game.folder}'
      });

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

      if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement) {
        // Enter fullscreen
        if (wrapper.requestFullscreen) {
          wrapper.requestFullscreen();
        } else if (wrapper.webkitRequestFullscreen) {
          wrapper.webkitRequestFullscreen();
        } else if (wrapper.mozRequestFullScreen) {
          wrapper.mozRequestFullScreen();
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

    // Prevent arrow keys, space, and WASD from scrolling the page when game is active
    window.addEventListener('keydown', (e) => {
      const gameFrame = document.getElementById('gameFrame');
      const blocked = [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];

      // Only prevent default if game is active (iframe has loaded)
      if (gameFrame && gameFrame.src && gameFrame.src !== '' && blocked.includes(e.key)) {
        e.preventDefault();
      }
    });

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
      } else {
        section.classList.add('expanded');
        btnText.textContent = 'Show Less';
        btnIcon.style.transform = 'rotate(180deg)';
      }
    }

    // Track game session end when user leaves the page
    window.addEventListener('beforeunload', () => {
      if (gameStartTime) {
        const playDuration = Math.round((Date.now() - gameStartTime) / 1000);
        gtag('event', 'game_session_end', {
          game_name: '${game.name}',
          game_folder: '${game.folder}',
          duration_seconds: playDuration
        });
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
