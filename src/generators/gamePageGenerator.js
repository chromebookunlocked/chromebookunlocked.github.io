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
      return `<a href="${g.folder}.html" class="game-card" title="Play ${g.name} Unblocked Free Online">
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
      <img src="assets/logo.png" alt="Chromebook Unlocked Games - Free Unblocked Games for School" class="header-logo" onclick="window.location.href='index.html'">
      <h1 onclick="window.location.href='index.html'">Chromebook Unlocked Games</h1>
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
      <button class="back-button" onclick="window.location.href='index.html'" title="Back to Unblocked Games" aria-label="Back to Free Unblocked Games">
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
          <button class="play-btn" onclick="startGame()" aria-label="Play ${game.name} Free Online">▶ Play</button>
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
              `<a href="index.html#/category/${encodeURIComponent(cat)}" class="category-tag" title="Play Free ${cat} Games Unblocked">${cat}</a>`
          )
          .join("")}
      </div>
    </div>

    <!-- SEO Game Description Section -->
    <section class="game-description" aria-label="About ${game.name}">
      <h2>Play ${game.name} Unblocked</h2>
      <p itemprop="description">
        <span class="description-preview">Play ${game.name} unblocked</span><span class="description-full"> - ${seoDescription.replace(/^Play [^!]+unblocked[^!]*!\s*/i, '')} This free online game is perfect for playing at school on your Chromebook or any computer.
        ${game.name} is one of the best ${categoryText} games available on our unblocked games site.
        No downloads needed - just click play and enjoy ${game.name} instantly in your browser!</span>
      </p>
      <p class="description-full">
        <strong>How to Play ${game.name}:</strong> Click the play button above to start the game.
        ${game.name} works on all devices including Chromebooks, laptops, and desktop computers.
        Use fullscreen mode for the best gaming experience!
      </p>
      <button class="show-more-btn" onclick="toggleDescription()" aria-label="Show more description">
        <span class="show-more-text">Show more</span>
        <svg class="show-more-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
    </section>
  </main>

  <!-- You Might Also Like Section -->
  <section class="recommendations" aria-label="Similar Unblocked Games">
    <h2>You Might Also Like - More Free Unblocked Games</h2>
    <div class="grid">
      ${recommendedGamesHTML}
    </div>
  </section>

  <footer>
    <p>
      <strong>${game.name} Unblocked</strong> - Play Free Online on <a href="index.html" title="Free Unblocked Games for School">Chromebook Unlocked Games</a>
      <br>
      <span>Categories: ${categoryList}</span> | <a href="dmca.html">DMCA</a>
      <br>
      <small>Play ${game.name} and 100+ more free unblocked games at school. No downloads, no blocks - just fun!</small>
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

    // Toggle description show more/less
    function toggleDescription() {
      const description = document.querySelector('.game-description');
      const btn = document.querySelector('.show-more-btn');
      const btnText = btn.querySelector('.show-more-text');
      const btnIcon = btn.querySelector('.show-more-icon');

      if (description.classList.contains('expanded')) {
        description.classList.remove('expanded');
        btnText.textContent = 'Show more';
        btnIcon.style.transform = 'rotate(0deg)';
      } else {
        description.classList.add('expanded');
        btnText.textContent = 'Show less';
        btnIcon.style.transform = 'rotate(180deg)';
      }
    }

  </script>
</body>
</html>`;
}

module.exports = {
  generateGamePage,
};
