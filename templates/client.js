const MAX_RECENT = 25;
const offsets = {}; // offsets[category] = number of revealed rows - 1
let currentViewMode = 'home'; // Track current view: 'home' or 'category'

// Get all valid game folders
function getValidGameFolders() {
  const folders = new Set();
  document.querySelectorAll('.game-card[data-folder]').forEach(card => {
    folders.add(card.getAttribute('data-folder'));
  });
  return folders;
}

// Clean recently played - remove games that no longer exist
function cleanRecentlyPlayed() {
  const validFolders = getValidGameFolders();
  let list = [];
  try {
    list = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
  } catch(e) { list = []; }

  // Filter out games whose folders don't exist anymore
  const cleaned = list.filter(game => validFolders.has(game.folder));

  // Only update if something was removed
  if (cleaned.length !== list.length) {
    localStorage.setItem('recentlyPlayed', JSON.stringify(cleaned));
    console.log('Cleaned recently played:', list.length - cleaned.length, 'games removed');
    return cleaned;
  }
  return list;
}

// Validate game exists before showing
function gameExists(folder) {
  const validFolders = getValidGameFolders();
  return validFolders.has(folder);
}

// Helper: get grid element for a category
function gridForCategory(cat) {
  return Array.from(document.querySelectorAll('.category'))
    .find(el => el.getAttribute('data-category') === cat)
    ?.querySelector('.grid');
}

// Cache for grid column counts to avoid forced reflows
const columnCountCache = new WeakMap();

// Helper: compute number of columns currently active for a grid
function getColumnCount(grid) {
  if (!grid) return 1;

  // Check cache first
  if (columnCountCache.has(grid)) {
    return columnCountCache.get(grid);
  }

  const style = window.getComputedStyle(grid);
  const cols = style.gridTemplateColumns;
  if (!cols) return 1;
  const count = cols.split(' ').filter(Boolean).length;

  // Cache the result
  columnCountCache.set(grid, count);
  return count;
}

// Clear column count cache (call on resize)
function clearColumnCountCache() {
  columnCountCache.clear();
}

// Load thumbnail from data-src to src
function loadThumbnail(card) {
  const img = card.querySelector('img.thumb[data-src]');
  if (img && img.hasAttribute('data-src')) {
    const src = img.getAttribute('data-src');
    img.src = src;
    img.removeAttribute('data-src');
  }
}

// Create a "more" element
function createMoreCard(cat) {
  const more = document.createElement('div');
  more.className = 'card more';
  more.innerHTML = '<div class="dots">⋯</div><div class="label">Show More</div>';
  more.addEventListener('click', (e) => {
    offsets[cat] = (offsets[cat] || 0) + 1;
    updateCategoryView(cat);
  });
  return more;
}

// Show/hide cards for a category grid based on offset and current columns
function updateCategoryView(cat) {
  const grid = gridForCategory(cat);
  if (!grid) return;

  // Remove any existing .card.more
  const existingMore = grid.querySelector('.card.more');
  if (existingMore) existingMore.remove();

  // Gather game-card elements
  const cards = Array.from(grid.querySelectorAll('.game-card'));
  const total = cards.length;

  // If viewing specific category, show all cards and load thumbnails
  if (currentViewMode === 'category') {
    cards.forEach(c => {
      c.style.display = '';
      loadThumbnail(c);
    });
    return;
  }

  const cols = getColumnCount(grid);

  // Number of rows currently revealed
  const rowsRevealed = (offsets[cat] || 0) + 1;
  const slots = rowsRevealed * cols;

  // Check if we need a "more" card (only on home page)
  const showMore = total > slots && currentViewMode === 'home';

  // Number of actual game items to show
  const showCount = showMore ? (slots - 1) : Math.min(total, slots);

  // Show/hide cards and load thumbnails for visible cards
  cards.forEach((c, idx) => {
    const shouldShow = idx < showCount;
    c.style.display = shouldShow ? '' : 'none';

    // Load thumbnail when card becomes visible
    if (shouldShow) {
      loadThumbnail(c);
    }
  });

  // If we should show a More card, append it at the end
  if (showMore) {
    const moreCard = createMoreCard(cat);
    grid.appendChild(moreCard);
  }
}

// Update all categories
function updateAllCategories() {
  const cats = Array.from(document.querySelectorAll('.category')).map(c => c.getAttribute('data-category'));
  cats.forEach(cat => {
    if (offsets[cat] === undefined) offsets[cat] = 0;

    const grid = gridForCategory(cat);
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('.game-card'));
    const total = cards.length;
    const cols = getColumnCount(grid) || 1;
    const maxRows = Math.ceil(total / cols);
    const maxOffset = Math.max(0, maxRows - 1);

    if (offsets[cat] > maxOffset) offsets[cat] = maxOffset;

    updateCategoryView(cat);
  });
}

// Populate Recently Played grid (optimized to prevent layout shifts)
function loadRecentlyPlayed() {
  // Skip if already loaded by inline script
  if (window.__recentlyPlayedLoaded) {
    // Still need to set up offset and update view
    if (offsets['Recently Played'] === undefined) offsets['Recently Played'] = 0;
    updateCategoryView('Recently Played');
    return;
  }

  let list = cleanRecentlyPlayed(); // Clean before loading

  const recentSection = document.getElementById('recentlyPlayedSection');
  const recentGrid = document.getElementById('recentlyPlayedGrid');
  if (!recentGrid) return;

  // Use DocumentFragment to batch DOM updates (prevents layout thrashing)
  const fragment = document.createDocumentFragment();

  if (!list.length) {
    // Keep section hidden, don't modify DOM
    return;
  }

  // Sort by lastPlayed timestamp (most recent first)
  list.sort((a, b) => {
    const timeA = a.lastPlayed || 0;
    const timeB = b.lastPlayed || 0;
    return timeB - timeA; // Descending order (newest first)
  });

  const displayList = list.slice(0, MAX_RECENT);

  // Build cards in memory first
  displayList.forEach((g, i) => {
    // Verify game still exists
    if (!gameExists(g.folder)) {
      console.log('Skipping deleted game:', g.folder);
      return;
    }

    const card = document.createElement('div');
    card.className = 'card game-card';
    card.setAttribute('data-index', i);
    card.setAttribute('data-folder', g.folder);
    card.setAttribute('data-name', g.name.toLowerCase());

    // Add error handling for broken images
    const thumbUrl = g.thumb || 'assets/logo.webp';

    card.onclick = () => {
      // Verify game exists before opening
      if (!gameExists(g.folder)) {
        alert('This game is no longer available.');
        cleanRecentlyPlayed();
        loadRecentlyPlayed();
        return;
      }
      window.location.href = '/' + g.folder + '.html';
    };

    // Eagerly load first 6 thumbnails, lazy load the rest
    const isFirstRow = i < 6;
    const srcAttr = isFirstRow ? `src="${thumbUrl}"` : `data-src="${thumbUrl}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3C/svg%3E"`;
    const loadingAttr = isFirstRow ? 'eager' : 'lazy';

    card.innerHTML = `<div class="thumb-container" style="--thumb-url: url('${thumbUrl}')">
      <img class="thumb" ${srcAttr} alt="${g.name}" loading="${loadingAttr}" decoding="async" width="300" height="300" onerror="this.src='assets/logo.webp'">
    </div>
    <div class="card-title">${g.name}</div>`;
    fragment.appendChild(card);
  });

  // If we have cards, do a single DOM update
  if (fragment.children.length > 0) {
    // Clear and append all at once
    recentGrid.innerHTML = '';
    recentGrid.appendChild(fragment);

    // Show section only after content is ready
    if (recentSection) recentSection.style.display = 'block';

    if (offsets['Recently Played'] === undefined) offsets['Recently Played'] = 0;
    updateCategoryView('Recently Played');
  }
}

// Search functionality with dropdown
function searchGames(query) {
  const searchTerm = query.toLowerCase().trim();
  const searchDropdown = document.getElementById('searchDropdown');

  if (!searchTerm) {
    // Hide dropdown when search is empty
    searchDropdown.classList.remove('show');
    searchDropdown.innerHTML = '';
    return;
  }

  // Collect all matching games
  const matchingGames = [];
  const seenFolders = new Set();

  document.querySelectorAll('.game-card[data-folder]').forEach(card => {
    const gameName = card.getAttribute('data-name') || '';
    const gameFolder = card.getAttribute('data-folder');
    const gameAliases = card.getAttribute('data-aliases') || '';
    const gameTitle = card.querySelector('.card-title')?.textContent || '';
    const thumbImg = card.querySelector('.thumb');

    // Get thumbnail URL - check data-src first (for lazy-loaded images), then src, then fallback to logo
    let thumbSrc = '';
    if (thumbImg) {
      thumbSrc = thumbImg.getAttribute('data-src') || thumbImg.src || 'assets/logo.webp';
      // If src is still the placeholder SVG, try to get from thumb-container CSS variable
      if (thumbSrc.startsWith('data:image/svg+xml')) {
        const thumbContainer = card.querySelector('.thumb-container');
        if (thumbContainer) {
          const cssVar = thumbContainer.style.getPropertyValue('--thumb-url');
          if (cssVar) {
            // Extract URL from url('...') format
            const match = cssVar.match(/url\(['"]?([^'"]+)['"]?\)/);
            if (match) thumbSrc = match[1];
          }
        }
      }
    } else {
      thumbSrc = 'assets/logo.webp';
    }

    // Check if name or any alias matches the search term
    const nameMatches = gameName.includes(searchTerm);
    const aliasMatches = gameAliases && gameAliases.split(',').some(alias => alias.includes(searchTerm));

    if ((nameMatches || aliasMatches) && !seenFolders.has(gameFolder)) {
      seenFolders.add(gameFolder);
      matchingGames.push({
        folder: gameFolder,
        name: gameTitle,
        thumb: thumbSrc
      });
    }
  });

  // Sort by relevance (exact matches first, then starts with, then contains)
  matchingGames.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();

    // Exact match
    if (aName === searchTerm) return -1;
    if (bName === searchTerm) return 1;

    // Starts with search term
    if (aName.startsWith(searchTerm) && !bName.startsWith(searchTerm)) return -1;
    if (!aName.startsWith(searchTerm) && bName.startsWith(searchTerm)) return 1;

    // Alphabetical
    return aName.localeCompare(bName);
  });

  // Limit to top 8 results
  const topResults = matchingGames.slice(0, 8);

  // Display results in dropdown
  if (topResults.length === 0) {
    searchDropdown.innerHTML = '<div class="search-no-results">No games found</div>';
  } else {
    searchDropdown.innerHTML = topResults.map(game => {
      return `<div class="search-result-item" onclick="window.location.href='/${game.folder}.html'">
        <img class="search-result-thumb" src="${game.thumb}" alt="${game.name}" loading="lazy" decoding="async" width="60" height="60">
        <div class="search-result-name">${game.name}</div>
      </div>`;
    }).join('');
  }

  searchDropdown.classList.add('show');
}

function hideSearchDropdown() {
  const searchDropdown = document.getElementById('searchDropdown');
  const searchBar = document.getElementById('searchBar');
  searchDropdown.classList.remove('show');
  searchBar.value = '';
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const searchContainer = document.getElementById('searchContainer');
  const searchDropdown = document.getElementById('searchDropdown');
  if (searchContainer && !searchContainer.contains(e.target)) {
    searchDropdown.classList.remove('show');
  }
});

// Navigate to home page
function goToHome() {
  window.history.pushState(null, '', '/');
  const searchBar = document.getElementById('searchBar');
  if (searchBar) searchBar.value = '';
  hideSearchDropdown();
  filterCategory('Home', false); // Don't update URL again since we just did
}

// Recently played storage helpers - called from individual game pages
function saveRecentlyPlayed(game) {
  let list = cleanRecentlyPlayed(); // Clean before saving

  // Remove existing entry if present
  list = list.filter(g => g.folder !== game.folder);

  // Add timestamp to track when game was played
  const gameWithTimestamp = {
    ...game,
    lastPlayed: Date.now()
  };

  list.unshift(gameWithTimestamp);
  if (list.length > MAX_RECENT) list = list.slice(0, MAX_RECENT);
  localStorage.setItem('recentlyPlayed', JSON.stringify(list));

  // Reset flag to force reload with new data
  window.__recentlyPlayedLoaded = false;
  loadRecentlyPlayed();
}

// Category filtering (clicking sidebar)
function filterCategory(cat, updateURL = true) {
  const all = document.querySelectorAll('.category');
  const searchBar = document.getElementById('searchBar');

  // Update URL if requested
  if (updateURL) {
    if (cat === 'Home') {
      window.history.pushState(null, '', '/');
    } else {
      window.history.pushState(null, '', '#/category/' + encodeURIComponent(cat));
    }
  }

  // Clear search when changing categories
  if (searchBar) searchBar.value = '';
  hideSearchDropdown();

  // Hide search section
  const searchResults = document.getElementById('searchResultsSection');
  if (searchResults) searchResults.style.display = 'none';

  if (cat === 'Home') {
    currentViewMode = 'home';
    all.forEach(c => {
      const category = c.getAttribute('data-category');
      const hideOnHome = c.getAttribute('data-hide-on-home');

      // Skip special sections
      if (c.id === 'searchResultsSection' || category === 'All Games') return;

      // Show recently played, trending games, newly added, and all categories on home (except those with less than 4 games)
      if (category === 'Recently Played') {
        const recentGrid = document.getElementById('recentlyPlayedGrid');
        c.style.display = (recentGrid && recentGrid.children.length > 0) ? 'block' : 'none';
      } else if (category === 'Trending Games') {
        // Always show Trending Games on home page
        c.style.display = 'block';
      } else if (category === 'Newly Added') {
        // Always show Newly Added on home page
        c.style.display = 'block';
      } else if (category === 'Trading Games') {
        // Hide Trading Games on home page (only accessible via sidebar)
        c.style.display = 'none';
      } else if (hideOnHome === 'true') {
        // Hide categories with less than 4 games on home view
        c.style.display = 'none';
      } else {
        c.style.display = 'block';
      }
    });
  } else if (cat === 'All Games') {
    currentViewMode = 'category';
    all.forEach(c => {
      const category = c.getAttribute('data-category');

      // Show only the All Games section
      if (category === 'All Games') {
        c.style.display = 'block';
      } else {
        c.style.display = 'none';
      }
    });
  } else {
    currentViewMode = 'category';
    all.forEach(c => {
      const category = c.getAttribute('data-category');

      // Skip special sections
      if (c.id === 'searchResultsSection') return;
      if (category === 'All Games') {
        c.style.display = 'none';
        return;
      }

      // Show only selected category (show all games at once, even if it has less than 4 games)
      c.style.display = (category === cat) ? 'block' : 'none';
    });
  }

  document.getElementById('content').scrollTop = 0;
  updateAllCategories();
}

// Routing & deep links
function handleRouting() {
  const hash = window.location.hash;

  if (hash.startsWith('#/category/')) {
    const category = decodeURIComponent(hash.replace('#/category/', ''));
    filterCategory(category, false); // Don't update URL since we're already routing
  } else {
    filterCategory('Home', false); // Don't update URL since we're already routing
  }
}

// On window resize - debounced and batched
let resizeTimeout = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    // Use requestAnimationFrame to batch layout reads
    requestAnimationFrame(() => {
      clearColumnCountCache();
      updateAllCategories();
    });
  }, 120);
});

// Intersection Observer for better lazy loading (progressive loading of images)
function setupIntersectionObserver() {
  // Only setup if browser supports Intersection Observer
  if (!('IntersectionObserver' in window)) {
    return; // Fallback to native lazy loading only
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        // Image is now in viewport, browser will load it due to loading="lazy"
        // We can add preloading for next images here if needed
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px 0px', // Start loading 50px before image enters viewport
    threshold: 0.01
  });

  // Observe all thumbnail images
  document.querySelectorAll('img.thumb').forEach(img => {
    imageObserver.observe(img);
  });
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
  // Load recently played FIRST to minimize layout shift
  loadRecentlyPlayed();

  document.querySelectorAll('.category').forEach(c => {
    const cat = c.getAttribute('data-category');
    if (offsets[cat] === undefined) offsets[cat] = 0;
  });

  document.querySelectorAll('.thumb-container').forEach(tc => {
    const img = tc.querySelector('img.thumb');
    if (img && (!tc.style.getPropertyValue('--thumb-url') || tc.style.getPropertyValue('--thumb-url') === '')) {
      tc.style.setProperty('--thumb-url', "url('" + img.src + "')");
    }
  });

  // Add error handlers to all thumbnails
  document.querySelectorAll('img.thumb').forEach(img => {
    img.onerror = function() {
      this.onerror = null; // Prevent infinite loop
      this.src = 'assets/logo.webp';
      const container = this.closest('.thumb-container');
      if (container) {
        container.style.setProperty('--thumb-url', "url('assets/logo.webp')");
      }
    };
  });

  // Setup Intersection Observer for progressive loading
  setupIntersectionObserver();

  updateAllCategories();
  handleRouting();
  window.addEventListener('hashchange', handleRouting);
});
