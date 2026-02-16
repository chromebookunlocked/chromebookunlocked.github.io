// Lazy Loading State
let renderedCount = window.__renderedCount || 0;
let isLoading = false;
let allGamesLoaded = false;
let currentCategory = null; // null = home (all games), or category name

// Recently Played Configuration
const MAX_RECENT_GAMES = 15;
const RECENTLY_PLAYED_KEY = 'recentlyPlayed';

// Mobile Detection
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (window.innerWidth <= 768);
}

/**
 * Get recently played games from localStorage
 * @returns {Array} Array of folder names
 */
function getRecentlyPlayed() {
  try {
    const stored = localStorage.getItem(RECENTLY_PLAYED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Add a game to recently played list
 * @param {string} folder - Game folder name
 */
function addToRecentlyPlayed(folder) {
  try {
    let recent = getRecentlyPlayed();
    // Remove if already exists (will re-add at front)
    recent = recent.filter(f => f !== folder);
    // Add to front
    recent.unshift(folder);
    // Keep only last MAX_RECENT_GAMES
    recent = recent.slice(0, MAX_RECENT_GAMES);
    localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(recent));
    // Show the nav item if we now have recent games
    updateRecentlyPlayedNav();
  } catch (e) {
    // localStorage might be full or disabled
  }
}

/**
 * Update the Recently Played nav item visibility
 */
function updateRecentlyPlayedNav() {
  const navItem = document.getElementById('recentlyPlayedNav');
  if (navItem) {
    const recent = getRecentlyPlayed();
    navItem.style.display = recent.length > 0 ? '' : 'none';
  }
}

// Ad tile configuration
const AD_FIRST_POSITION = window.__adFirstPosition || 13;
const AD_INTERVAL = window.__adInterval || 20;
let adCount = window.__adCount || 0;

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
 * Create an ad tile element
 * @param {number} adIndex - Unique index for this ad tile
 * @returns {HTMLElement} Ad tile element
 */
function createAdTile(adIndex) {
  const tile = document.createElement('div');
  tile.className = 'card ad-tile';
  tile.setAttribute('data-ad-index', adIndex);
  tile.innerHTML = `<div class="ad-content">
    <ins class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-1033412505744705"
      data-ad-slot="1961978889"
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>
  </div>`;
  return tile;
}

/**
 * Initialize an ad tile
 * @param {HTMLElement} tile - The ad tile element
 */
function initializeAdTile(tile) {
  // Don't initialize ads if bot is detected
  if (window.botDetector && window.botDetector.shouldBlockAds()) {
    return;
  }

  try {
    (adsbygoogle = window.adsbygoogle || []).push({});
  } catch (e) {}
}

// Cached DOM elements for performance
let cachedElements = null;
function getCachedElements() {
  if (!cachedElements) {
    cachedElements = {
      searchBar: document.getElementById('searchBar'),
      searchDropdown: document.getElementById('searchDropdown'),
      searchContainer: document.getElementById('searchContainer'),
      content: document.getElementById('content'),
      gamesGrid: document.getElementById('gamesGrid'),
      loadingIndicator: document.getElementById('loadingIndicator'),
      scrollSentinel: document.getElementById('scrollSentinel'),
      allGamesSection: document.getElementById('allGamesSection')
    };
  }
  return cachedElements;
}

// Escape HTML to prevent XSS
function escapeHtml(str) {
  if (str == null) return '';
  if (typeof str !== 'string') str = String(str);
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Escape HTML attribute value
function escapeHtmlAttr(str) {
  if (str == null) return '';
  if (typeof str !== 'string') str = String(str);
  return escapeHtml(str)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Create a game card element
 * @param {Object} game - Game data object {n: name, f: folder, t: thumb, a: aliases, c: categories}
 * @param {number} idx - Card index
 * @param {boolean} eagerLoad - Whether to eager load the thumbnail
 * @returns {HTMLElement} Card element
 */
function createGameCard(game, idx, eagerLoad = false) {
  const card = document.createElement('div');
  card.className = 'card game-card';
  card.setAttribute('data-index', idx);
  card.setAttribute('data-folder', game.f);
  card.setAttribute('data-name', game.n.toLowerCase());

  if (game.a && game.a.length > 0) {
    card.setAttribute('data-aliases', game.a.map(a => a.toLowerCase()).join(','));
  }

  if (game.c && game.c.length > 0) {
    card.setAttribute('data-categories', game.c.join(','));
  }

  card.onclick = () => {
    // Track as recently played before navigating
    addToRecentlyPlayed(game.f);
    window.location.href = '/' + game.f + '.html';
  };

  const thumbUrl = escapeHtmlAttr(game.t);
  const gameName = escapeHtml(game.n);
  const gameNameAttr = escapeHtmlAttr(game.n);

  // Use data-src for lazy loading, src for eager loading
  const srcAttr = eagerLoad
    ? `src="${thumbUrl}"`
    : `data-src="${thumbUrl}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3C/svg%3E"`;
  const loadingAttr = eagerLoad ? 'eager' : 'lazy';

  card.innerHTML = `<div class="thumb-container" style="--thumb-url: url('${thumbUrl}')">
    <img class="thumb" ${srcAttr} alt="${gameNameAttr}" loading="${loadingAttr}" decoding="async" width="300" height="300" onerror="this.src='assets/logo.webp'">
  </div>
  <div class="card-title">${gameName}</div>`;

  return card;
}

/**
 * Get filtered games based on current category
 * @returns {Array} Filtered game data array
 */
function getFilteredGames() {
  let allGames = window.__gameData || [];

  // Filter by Mobile category if on mobile device
  if (isMobileDevice()) {
    allGames = allGames.filter(game => {
      return game.c && game.c.includes('Mobile');
    });
  }

  if (!currentCategory) {
    return allGames; // Home - show all games (filtered by mobile if needed)
  }

  // Special category: Recently Played
  if (currentCategory === 'Recently Played') {
    const recentFolders = getRecentlyPlayed();
    // Return games in the order they were played (most recent first)
    const recentGames = [];
    for (const folder of recentFolders) {
      const game = allGames.find(g => g.f === folder);
      if (game) recentGames.push(game);
    }
    return recentGames;
  }

  // Special category: Newly Added
  if (currentCategory === 'Newly Added') {
    const newlyAddedFolders = window.__newlyAddedFolders || [];
    // Return games in the order from server (most recent first)
    const newlyAddedGames = [];
    for (const folder of newlyAddedFolders) {
      const game = allGames.find(g => g.f === folder);
      if (game) newlyAddedGames.push(game);
    }
    return newlyAddedGames;
  }

  return allGames.filter(game => {
    return game.c && game.c.includes(currentCategory);
  });
}

/**
 * Load more games into the grid
 * @param {number} count - Number of games to load
 */
function loadMoreGames(count) {
  if (isLoading || allGamesLoaded) return;

  const { gamesGrid, loadingIndicator } = getCachedElements();
  if (!gamesGrid) return;

  const filteredGames = getFilteredGames();
  const totalGames = filteredGames.length;

  if (renderedCount >= totalGames) {
    allGamesLoaded = true;
    return;
  }

  isLoading = true;
  if (loadingIndicator) loadingIndicator.style.display = 'block';

  // Use requestAnimationFrame for smooth rendering
  requestAnimationFrame(() => {
    const fragment = document.createDocumentFragment();
    const endIndex = Math.min(renderedCount + count, totalGames);
    const newAdTiles = [];

    for (let i = renderedCount; i < endIndex; i++) {
      const game = filteredGames[i];
      const card = createGameCard(game, i, false);
      fragment.appendChild(card);

      // Setup lazy loading for the image
      const img = card.querySelector('img.thumb[data-src]');
      if (img && imageObserver) {
        imageObserver.observe(img);
      }

      // Check if we should insert an ad tile after this game
      if (shouldInsertAdAfter(i)) {
        const adTile = createAdTile(adCount);
        fragment.appendChild(adTile);
        newAdTiles.push(adTile);
        adCount++;
      }
    }

    gamesGrid.appendChild(fragment);
    renderedCount = endIndex;

    // Initialize new ad tiles after they're in the DOM
    newAdTiles.forEach(initializeAdTile);

    if (renderedCount >= totalGames) {
      allGamesLoaded = true;
    }

    isLoading = false;
    if (loadingIndicator) loadingIndicator.style.display = 'none';
  });
}

/**
 * Reset and reload the grid with optional category filter
 * @param {string|null} category - Category to filter by, or null for all games
 */
function resetAndReloadGrid(category) {
  const { gamesGrid, content } = getCachedElements();
  if (!gamesGrid) return;

  currentCategory = category;
  renderedCount = 0;
  allGamesLoaded = false;
  isLoading = false;
  adCount = 0; // Reset ad count for new grid

  // Clear existing cards
  gamesGrid.innerHTML = '';

  // Calculate initial load based on viewport
  const columnsPerRow = getColumnCount();
  const rowsToLoad = window.__rowsPerLoad ? window.__rowsPerLoad + 2 : 5;
  const initialCount = columnsPerRow * rowsToLoad;

  // Load initial games
  loadMoreGames(initialCount);

  // Scroll to top
  if (content) content.scrollTop = 0;

  // Update section title
  const { allGamesSection } = getCachedElements();
  if (allGamesSection) {
    const h2 = allGamesSection.querySelector('h2');
    if (h2) {
      h2.textContent = category || 'All Games';
    }
  }
}

// Get number of columns in grid
function getColumnCount() {
  const { gamesGrid } = getCachedElements();
  if (!gamesGrid) return 6;

  const style = window.getComputedStyle(gamesGrid);
  const cols = style.gridTemplateColumns;
  if (!cols) return 6;

  return cols.split(' ').filter(Boolean).length || 6;
}

// Intersection Observer for lazy loading images
let imageObserver = null;

function setupImageObserver() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: load all images with data-src
    document.querySelectorAll('img.thumb[data-src]').forEach(img => {
      img.src = img.getAttribute('data-src');
      img.removeAttribute('data-src');
    });
    return;
  }

  imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.hasAttribute('data-src')) {
          img.src = img.getAttribute('data-src');
          img.removeAttribute('data-src');
        }
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '100px 0px',
    threshold: 0.01
  });

  // Observe existing images
  document.querySelectorAll('img.thumb[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

// Intersection Observer for infinite scroll
let scrollObserver = null;

function setupScrollObserver() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: use scroll event
    const { content } = getCachedElements();
    if (content) {
      content.addEventListener('scroll', handleScrollFallback);
    }
    return;
  }

  const { scrollSentinel } = getCachedElements();
  if (!scrollSentinel) return;

  scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !isLoading && !allGamesLoaded) {
        const columnsPerRow = getColumnCount();
        const rowsToLoad = window.__rowsPerLoad || 3;
        loadMoreGames(columnsPerRow * rowsToLoad);
      }
    });
  }, {
    rootMargin: `${window.__scrollThreshold || 300}px 0px`,
    threshold: 0
  });

  scrollObserver.observe(scrollSentinel);
}

// Fallback scroll handler for browsers without IntersectionObserver
function handleScrollFallback() {
  const { content } = getCachedElements();
  if (!content || isLoading || allGamesLoaded) return;

  const scrollTop = content.scrollTop;
  const scrollHeight = content.scrollHeight;
  const clientHeight = content.clientHeight;
  const threshold = window.__scrollThreshold || 300;

  if (scrollHeight - scrollTop - clientHeight < threshold) {
    const columnsPerRow = getColumnCount();
    const rowsToLoad = window.__rowsPerLoad || 3;
    loadMoreGames(columnsPerRow * rowsToLoad);
  }
}

// Search functionality
function searchGames(query) {
  const searchTerm = query.toLowerCase().trim();
  const { searchDropdown } = getCachedElements();

  if (!searchTerm) {
    searchDropdown.classList.remove('show');
    searchDropdown.innerHTML = '';
    return;
  }

  const allGames = window.__gameData || [];
  const matchingGames = [];

  for (const game of allGames) {
    const nameLower = game.n.toLowerCase();
    const nameMatches = nameLower.includes(searchTerm);
    const aliasMatches = game.a && game.a.some(alias =>
      alias.toLowerCase().includes(searchTerm)
    );

    if (nameMatches || aliasMatches) {
      matchingGames.push({
        folder: game.f,
        name: game.n,
        thumb: game.t,
        // Score for sorting
        score: nameLower === searchTerm ? 3 :
               nameLower.startsWith(searchTerm) ? 2 : 1
      });
    }
  }

  // Sort by relevance
  matchingGames.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });

  // Limit to top 8 results
  const topResults = matchingGames.slice(0, 8);

  if (topResults.length === 0) {
    searchDropdown.innerHTML = '<div class="search-no-results">No games found</div>';
  } else {
    searchDropdown.innerHTML = topResults.map(game => {
      const escapedFolder = escapeHtmlAttr(game.folder);
      const escapedThumb = escapeHtmlAttr(game.thumb);
      const escapedName = escapeHtmlAttr(game.name);
      const escapedNameText = escapeHtml(game.name);
      return `<div class="search-result-item" onclick="addToRecentlyPlayed('${escapedFolder}'); window.location.href='/${escapedFolder}.html'">
        <img class="search-result-thumb" src="${escapedThumb}" alt="${escapedName}" loading="lazy" decoding="async" width="60" height="60" onerror="this.src='assets/logo.webp'">
        <div class="search-result-name">${escapedNameText}</div>
      </div>`;
    }).join('');
  }

  searchDropdown.classList.add('show');
}

function hideSearchDropdown() {
  const { searchDropdown, searchBar } = getCachedElements();
  if (searchDropdown) searchDropdown.classList.remove('show');
  if (searchBar) searchBar.value = '';
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const { searchContainer, searchDropdown } = getCachedElements();
  if (searchContainer && searchDropdown && !searchContainer.contains(e.target)) {
    searchDropdown.classList.remove('show');
  }
});

// Category filtering
function filterCategory(cat, updateURL = true) {
  const { searchBar } = getCachedElements();

  // Clear search
  if (searchBar) searchBar.value = '';
  hideSearchDropdown();

  // Update URL if requested
  if (updateURL) {
    if (cat === 'Home' || !cat) {
      window.history.pushState(null, '', '/');
    } else {
      window.history.pushState(null, '', '#/category/' + encodeURIComponent(cat));
    }
  }

  // Reset and reload with category filter
  if (cat === 'Home') {
    resetAndReloadGrid(null);
  } else {
    resetAndReloadGrid(cat);
  }
}

// Navigate to home
function goToHome() {
  window.history.pushState(null, '', '/');
  hideSearchDropdown();
  filterCategory('Home', false);
}

// Routing & deep links
function handleRouting() {
  const hash = window.location.hash;

  if (hash.startsWith('#/category/')) {
    const category = decodeURIComponent(hash.replace('#/category/', ''));
    filterCategory(category, false);
  } else {
    // Home - show all games
    filterCategory('Home', false);
  }
}

// Handle window resize - recalculate columns
let resizeTimeout = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    // Column count might have changed, but we don't need to reload
    // The grid handles responsiveness via CSS
  }, 150);
});

// Initial load
document.addEventListener('DOMContentLoaded', () => {
  // Setup observers
  setupImageObserver();
  setupScrollObserver();

  // Initialize Recently Played nav visibility
  updateRecentlyPlayedNav();

  // Add error handlers to existing thumbnails
  document.querySelectorAll('img.thumb').forEach(img => {
    img.onerror = function() {
      this.onerror = null;
      this.src = 'assets/logo.webp';
      const container = this.closest('.thumb-container');
      if (container) {
        container.style.setProperty('--thumb-url', "url('assets/logo.webp')");
      }
    };
  });

  // Handle routing
  handleRouting();
  window.addEventListener('hashchange', handleRouting);
});
