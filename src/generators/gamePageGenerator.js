const { chooseThumb, getAssetPath } = require("../utils/assetManager");
const { generateGameMetaTags, generateGameStructuredData } = require("../utils/seoBuilder");

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

  // Get similar games for "You Might Also Like" section
  const sameCategory = allGames.filter((g) =>
    g.folder !== game.folder &&
    g.categories.some((cat) => game.categories.includes(cat))
  );
  const otherGames = allGames.filter((g) => g.folder !== game.folder);

  // Shuffle and mix: 60% same category (14 games) + 40% random (21 games) = 35 total
  const shuffled = [
    ...sameCategory.slice(0, 14),
    ...otherGames.slice(0, 21),
  ]
    .sort(() => Math.random() - 0.5)
    .slice(0, 35); // 7 rows x 5 columns = 35 games

  const recommendedGamesHTML = shuffled
    .map((g) => {
      const gThumb = chooseThumb(g, gamesDir);
      return `<a href="${g.folder}.html" class="game-card">
      <div class="thumb-container" style="--thumb-url: url('games/${g.folder}/${gThumb}')">
        <img class="thumb" src="games/${g.folder}/${gThumb}" alt="${g.name}" loading="lazy">
      </div>
      <div class="card-title">${g.name}</div>
    </a>`;
    })
    .join("");

  // Get SEO meta tags and structured data
  const metaTags = generateGameMetaTags(game, thumbPath);
  const structuredData = generateGameStructuredData(game, thumbPath);

  return `<!DOCTYPE html>
<html lang="en">
<head>
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
      <img src="assets/logo.png" alt="Chromebook Unlocked Games Logo" class="logo" onclick="window.location.href='index.html'">
      <h1 onclick="window.location.href='index.html'">Chromebook Unlocked Games</h1>
    </div>
  </header>

  <!-- Game Viewer -->
  <div class="game-container">
    <!-- Back Button (outside game frame) -->
    <button class="back-button" onclick="window.location.href='index.html'" title="Back to Games" aria-label="Back to Games">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      <span>Back</span>
    </button>

    <div class="game-frame-wrapper" id="gameWrapper">
      <!-- Controls Bar (sticky to top of game) -->
      <div class="controls">
        <button id="fullscreenBtn" class="icon-btn" onclick="toggleFullscreen()" title="Fullscreen" aria-label="Toggle Fullscreen">
          <svg id="fullscreenIcon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
        </button>
      </div>

      <div class="play-overlay" id="playOverlay">
        <img src="games/${game.folder}/${thumb}" alt="${game.name}">
        <h2>${game.name}</h2>
        <button class="play-btn" onclick="startGame()">▶ Play</button>
      </div>
      <iframe
        id="gameFrame"
        src=""
        title="Play ${game.name} Unblocked"
        allow="fullscreen; autoplay; encrypted-media"
        allowfullscreen>
      </iframe>
    </div>

    <!-- Category Tags -->
    <div class="category-tags">
      ${game.categories
        .map(
          (cat) =>
            `<a href="index.html#/category/${encodeURIComponent(cat)}" class="category-tag">${cat}</a>`
        )
        .join("")}
    </div>
  </div>

  <!-- You Might Also Like Section -->
  <div class="recommendations">
    <h2>You Might Also Like</h2>
    <div class="grid">
      ${recommendedGamesHTML}
    </div>
  </div>

  <footer>
    <p>
      <strong>${game.name}</strong> - Free to play on <a href="index.html">Chromebook Unlocked Games</a>
      <br>
      Categories: ${categoryList} | <a href="dmca.html">DMCA</a>
    </p>
  </footer>

  ${structuredData}

  <script>
    function startGame() {
      const overlay = document.getElementById('playOverlay');
      const frame = document.getElementById('gameFrame');

      frame.src = '${gameUrl}';
      frame.classList.add('active');
      overlay.classList.add('hidden');
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

  </script>
</body>
</html>`;
}

module.exports = {
  generateGamePage,
};
