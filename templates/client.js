const MAX_RECENT = 25;
const offsets = {}; // offsets[category] = number of revealed rows - 1
let gameViewActive = false; // Track if game viewer is open
let currentViewMode = 'home'; // Track current view: 'home' or 'category'

// Get all valid game folders (excluding Recently Played section to avoid circular validation)
function getValidGameFolders() {
  const folders = new Set();
  // Only get cards from actual game catalog sections, NOT from recently played
  document.querySelectorAll('.category:not(#recentlyPlayedSection) .game-card[data-folder]').forEach(card => {
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

// Helper: compute number of columns currently active for a grid
function getColumnCount(grid) {
  if (!grid) return 1;
  const style = window.getComputedStyle(grid);
  const cols = style.gridTemplateColumns;
  if (!cols) return 1;
  return cols.split(' ').filter(Boolean).length;
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

  // If game viewer is active OR viewing specific category, show all cards
  if (gameViewActive || currentViewMode === 'category') {
    cards.forEach(c => c.style.display = '');
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

  // Show/hide cards
  cards.forEach((c, idx) => {
    c.style.display = (idx < showCount) ? '' : 'none';
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

// Populate Recently Played grid
function loadRecentlyPlayed() {
  let list = cleanRecentlyPlayed(); // Clean before loading

  const recentSection = document.getElementById('recentlyPlayedSection');
  const recentGrid = document.getElementById('recentlyPlayedGrid');
  if (!recentGrid) return;

  recentGrid.innerHTML = '';

  if (!list.length) {
    if (recentSection) recentSection.style.display = 'none';
    return;
  }

  if (recentSection) recentSection.style.display = 'block';

  // Sort by lastPlayed timestamp (most recent first)
  list.sort((a, b) => {
    const timeA = a.lastPlayed || 0;
    const timeB = b.lastPlayed || 0;
    return timeB - timeA; // Descending order (newest first)
  });

  const displayList = list.slice(0, MAX_RECENT);

  // Double-check each game exists before displaying
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
    const thumbUrl = g.thumb || 'assets/logo.png';

    card.onclick = () => {
      // Verify game exists before opening
      if (!gameExists(g.folder)) {
        alert('This game is no longer available.');
        cleanRecentlyPlayed();
        loadRecentlyPlayed();
        return;
      }
      window.location.href = g.folder + '.html';
    };

    card.innerHTML = `<div class="thumb-container" style="--thumb-url: url('${thumbUrl}')">
      <img class="thumb" src="${thumbUrl}" alt="${g.name}" onerror="this.src='assets/logo.png'">
    </div>
    <div class="card-title">${g.name}</div>`;
    recentGrid.appendChild(card);
  });

  if (offsets['Recently Played'] === undefined) offsets['Recently Played'] = 0;
  updateCategoryView('Recently Played');

  // If grid is empty after cleanup, hide section
  if (recentGrid.children.length === 0) {
    recentSection.style.display = 'none';
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
    const gameTitle = card.querySelector('.card-title')?.textContent || '';
    const thumbImg = card.querySelector('.thumb');
    const thumbSrc = thumbImg ? thumbImg.src : '';

    if (gameName.includes(searchTerm) && !seenFolders.has(gameFolder)) {
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
      return `<div class="search-result-item" onclick="window.location.href='${game.folder}.html'">
        <img class="search-result-thumb" src="${game.thumb}" alt="${game.name}">
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
  window.location.hash = '';
  const searchBar = document.getElementById('searchBar');
  if (searchBar) searchBar.value = '';
  hideSearchDropdown();
  closeGame();
  filterCategory('Home');
}

// Prepare game (open viewer overlay)
let currentGameFolder = null;
const viewer = document.getElementById('viewer');
const frame = document.getElementById('gameFrame');
const controls = document.getElementById('controls');
const gameTitle = document.getElementById('gameTitle');
const startOverlay = document.getElementById('startOverlay');
const startThumb = document.getElementById('startThumb');
const startName = document.getElementById('startName');

function prepareGame(folderEncoded, nameEncoded, thumbSrc) {
  const folder = decodeURIComponent(folderEncoded);
  const name = decodeURIComponent(nameEncoded);

  // Verify game exists before opening
  if (!gameExists(folder)) {
    alert('This game is no longer available.');
    cleanRecentlyPlayed();
    loadRecentlyPlayed();
    return;
  }

  currentGameFolder = folder;
  frame.src = '';
  viewer.style.display = 'flex';
  controls.classList.add('active');
  gameTitle.textContent = name;
  startThumb.src = thumbSrc || 'assets/logo.png';

  // Add error handler for thumbnail
  startThumb.onerror = () => {
    startThumb.src = 'assets/logo.png';
  };

  startName.textContent = name;
  startOverlay.style.opacity = '1';
  startOverlay.style.pointerEvents = 'auto';
  window.location.hash = '#/game/' + folderEncoded;
  document.getElementById('content').scrollTop = 0;

  // Set game view active
  gameViewActive = true;

  // CRITICAL: Force hide Recently Played section immediately
  const recentlyPlayedSection = document.getElementById('recentlyPlayedSection');
  if (recentlyPlayedSection) {
    recentlyPlayedSection.style.display = 'none';
    recentlyPlayedSection.style.visibility = 'hidden';
  }

  // Hide all other categories
  document.querySelectorAll('.category').forEach(cat => {
    if (cat.id !== 'curatedGamesSection' && cat.getAttribute('data-category') !== 'All Games') {
      cat.style.display = 'none';
    }
  });

  showCuratedGames(folder);

  saveRecentlyPlayed({ folder, name, thumb: thumbSrc || 'assets/logo.png' });
}

// Show curated games when game viewer is open - ALWAYS 7 ROWS
function showCuratedGames(currentGameFolder) {
  console.log('=== Starting showCuratedGames for:', currentGameFolder);

  // Hide search results if visible
  const searchResults = document.getElementById('searchResultsSection');
  if (searchResults) searchResults.style.display = 'none';

  // ✅ CRITICAL: Force hide Recently Played with multiple methods
  const recentSection = document.getElementById('recentlyPlayedSection');
  if (recentSection) {
    recentSection.style.display = 'none';
    recentSection.style.visibility = 'hidden';
    recentSection.style.position = 'absolute';
    recentSection.style.top = '-9999px';
  }

  // First, find current game's category from the original game categories
  let currentCategory = null;
  const categorySections = document.querySelectorAll('.category');

  categorySections.forEach(cat => {
    const catName = cat.getAttribute('data-category');
    if (catName === 'Recently Played' ||
        cat.id === 'recentlyPlayedSection' ||
        cat.id === 'searchResultsSection' ||
        cat.id === 'curatedGamesSection') {
      return;
    }

    const gameCards = cat.querySelectorAll('.game-card[data-folder]');
    gameCards.forEach(card => {
      if (card.getAttribute('data-folder') === currentGameFolder) {
        currentCategory = catName;
        console.log('Found current game in category:', catName);
      }
    });
  });

  // Collect ALL games from ALL real categories (including hidden ones)
  const allGames = [];
  const sameCategory = [];
  const seenFolders = new Set();
  seenFolders.add(currentGameFolder); // Don't include current game

  categorySections.forEach(cat => {
    const catName = cat.getAttribute('data-category');

    // Skip special sections
    if (catName === 'Recently Played' ||
        cat.id === 'recentlyPlayedSection' ||
        cat.id === 'searchResultsSection' ||
        cat.id === 'curatedGamesSection') {
      return;
    }

    const gameCards = cat.querySelectorAll('.game-card[data-folder]');

    gameCards.forEach(card => {
      const folder = card.getAttribute('data-folder');

      // Skip if already seen
      if (seenFolders.has(folder)) {
        return;
      }

      seenFolders.add(folder);

      // Clone and ensure the card is visible
      const clonedCard = card.cloneNode(true);
      clonedCard.style.display = ''; // Force show
      clonedCard.style.visibility = 'visible';

      const gameData = {
        card: clonedCard,
        folder: folder,
        category: catName
      };

      allGames.push(gameData);

      if (catName === currentCategory) {
        sameCategory.push(gameData);
      }
    });
  });

  console.log('Total unique games collected:', allGames.length);
  console.log('Same category games:', sameCategory.length);

  if (allGames.length === 0) {
    console.error('ERROR: No games found!');
    return;
  }

  // Shuffle arrays
  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const shuffledSameCategory = shuffleArray(sameCategory);
  const shuffledAllGames = shuffleArray(allGames);

  // ✅ ALWAYS fill exactly 7 rows - calculate columns dynamically
  const grid = document.getElementById('curatedGamesGrid') || document.createElement('div');
  const cols = getColumnCount(grid) || 5; // Get actual column count or default to 5
  const rows = 7; // Always 7 rows
  const targetCount = cols * rows; // Dynamic total based on screen size

  console.log('Grid columns:', cols, 'Target games:', targetCount);

  const curatedGames = [];

  if (sameCategory.length === 0) {
    // No same category - use all random
    curatedGames.push(...shuffledAllGames.slice(0, Math.min(targetCount, shuffledAllGames.length)));
  } else {
    // Mix: 60% same category, 40% other
    const sameCatTarget = Math.min(Math.ceil(targetCount * 0.6), sameCategory.length);

    // Add same category games
    curatedGames.push(...shuffledSameCategory.slice(0, sameCatTarget));

    // Add other games
    const usedFolders = new Set(curatedGames.map(g => g.folder));
    const otherGames = shuffledAllGames.filter(g => !usedFolders.has(g.folder));
    const remainingSlots = targetCount - curatedGames.length;

    curatedGames.push(...otherGames.slice(0, remainingSlots));
  }

  console.log('FINAL curated games count:', curatedGames.length);

  // Final shuffle
  const finalCurated = shuffleArray(curatedGames);

  // Hide all other categories
  categorySections.forEach(cat => {
    if (cat.id !== 'curatedGamesSection') {
      cat.style.display = 'none';
    }
  });

  // Create or update curated section
  let curatedSection = document.getElementById('curatedGamesSection');
  if (!curatedSection) {
    curatedSection = document.createElement('div');
    curatedSection.id = 'curatedGamesSection';
    curatedSection.className = 'category';
    curatedSection.innerHTML = '<h2>You Might Also Like</h2><div class="grid" id="curatedGamesGrid"></div>';
    const viewer = document.querySelector('.viewer');
    if (viewer.nextSibling) {
      viewer.parentNode.insertBefore(curatedSection, viewer.nextSibling);
    } else {
      viewer.parentNode.appendChild(curatedSection);
    }
  }

  curatedSection.style.display = 'block';
  const curatedGrid = document.getElementById('curatedGamesGrid');
  curatedGrid.innerHTML = '';

  // Display curated games
  finalCurated.forEach((game, idx) => {
    curatedGrid.appendChild(game.card);
  });

  console.log('=== Finished showCuratedGames');
}

function startGame() {
  if (!currentGameFolder) return;
  frame.src = 'games/' + currentGameFolder + '/index.html';
  startOverlay.style.opacity = '0';
  startOverlay.style.pointerEvents = 'none';
}

function closeGame() {
  frame.src = '';
  viewer.style.display = 'none';
  controls.classList.remove('active');
  gameTitle.textContent = '';
  currentGameFolder = null;
  startOverlay.style.opacity = '1';
  startOverlay.style.pointerEvents = 'auto';
  window.location.hash = '';

  // Deactivate game view and restore normal category view
  gameViewActive = false;

  // Hide curated and search results sections
  const curatedSection = document.getElementById('curatedGamesSection');
  if (curatedSection) curatedSection.style.display = 'none';

  const searchResults = document.getElementById('searchResultsSection');
  if (searchResults) searchResults.style.display = 'none';

  // Hide All Games section
  const allGamesSection = document.querySelector('[data-category="All Games"]');
  if (allGamesSection) allGamesSection.style.display = 'none';

  // Restore Recently Played visibility
  const recentlyPlayedSection = document.getElementById('recentlyPlayedSection');
  if (recentlyPlayedSection) {
    const recentGrid = document.getElementById('recentlyPlayedGrid');
    if (recentGrid && recentGrid.children.length > 0) {
      recentlyPlayedSection.style.display = 'block';
      recentlyPlayedSection.style.visibility = 'visible';
      recentlyPlayedSection.style.position = 'relative';
      recentlyPlayedSection.style.top = 'auto';
    }
  }

  // Show all normal categories again (exclude All Games)
  document.querySelectorAll('.category').forEach(cat => {
    const category = cat.getAttribute('data-category');
    if (category === 'Recently Played') {
      const recentGrid = document.getElementById('recentlyPlayedGrid');
      cat.style.display = (recentGrid && recentGrid.children.length > 0) ? 'block' : 'none';
    } else if (cat.id !== 'curatedGamesSection' && cat.id !== 'searchResultsSection' && category !== 'All Games') {
      cat.style.display = 'block';
    }
  });

  // Restore "show more" functionality
  updateAllCategories();
}

function toggleFullscreen() {
  const viewerElement = document.querySelector('.viewer');

  if (!document.fullscreenElement && !document.webkitFullscreenElement &&
      !document.mozFullScreenElement && !document.msFullscreenElement) {
    // Enter fullscreen
    if (viewerElement.requestFullscreen) {
      viewerElement.requestFullscreen();
    } else if (viewerElement.webkitRequestFullscreen) {
      viewerElement.webkitRequestFullscreen();
    } else if (viewerElement.mozRequestFullScreen) {
      viewerElement.mozRequestFullScreen();
    } else if (viewerElement.msRequestFullscreen) {
      viewerElement.msRequestFullscreen();
    }
  } else {
    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
}

// Listen for fullscreen changes to adjust iframe
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);

function handleFullscreenChange() {
  const viewer = document.querySelector('.viewer');
  const iframe = document.getElementById('gameFrame');

  if (document.fullscreenElement || document.webkitFullscreenElement ||
      document.mozFullScreenElement || document.msFullscreenElement) {
    // Entering fullscreen
    console.log('Entered fullscreen mode');
  } else {
    // Exiting fullscreen
    console.log('Exited fullscreen mode');
  }
}

// Recently played storage helpers
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
  loadRecentlyPlayed();
}

// Category filtering (clicking sidebar)
function filterCategory(cat, updateURL = true) {
  const all = document.querySelectorAll('.category');
  const searchBar = document.getElementById('searchBar');

  // Close game window if it's open
  if (gameViewActive) {
    closeGame();
  }

  // Update URL if requested
  if (updateURL) {
    if (cat === 'Home') {
      window.history.pushState(null, '', '#/');
    } else {
      window.history.pushState(null, '', '#/category/' + encodeURIComponent(cat));
    }
  }

  // Clear search when changing categories
  if (searchBar) searchBar.value = '';
  hideSearchDropdown();

  // Hide search and curated sections
  const searchResults = document.getElementById('searchResultsSection');
  if (searchResults) searchResults.style.display = 'none';

  const curatedSection = document.getElementById('curatedGamesSection');
  if (curatedSection) curatedSection.style.display = 'none';

  if (cat === 'Home') {
    currentViewMode = 'home';
    all.forEach(c => {
      const category = c.getAttribute('data-category');

      // Skip special sections
      if (c.id === 'searchResultsSection' || c.id === 'curatedGamesSection' || category === 'All Games') return;

      // Show recently played and all categories on home
      if (category === 'Recently Played') {
        const recentGrid = document.getElementById('recentlyPlayedGrid');
        c.style.display = (recentGrid && recentGrid.children.length > 0) ? 'block' : 'none';
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
      if (c.id === 'searchResultsSection' || c.id === 'curatedGamesSection' || category === 'All Games') return;

      // Show only selected category (show all games at once)
      c.style.display = (category === cat) ? 'block' : 'none';
    });
  }

  document.getElementById('content').scrollTop = 0;
  updateAllCategories();
}

// Routing & deep links
function handleRouting() {
  const hash = window.location.hash;

  if (hash.startsWith('#/game/')) {
    const folder = decodeURIComponent(hash.replace('#/game/', ''));

    // Check if game exists before trying to open
    if (!gameExists(folder)) {
      console.log('Game not found:', folder);
      alert('This game is no longer available.');
      window.location.hash = '';
      return;
    }

    const cards = Array.from(document.querySelectorAll('.game-card'));
    const card = cards.find(c => c.getAttribute('data-folder') === folder);
    if (card) {
      const gameName = card.getAttribute('data-name');
      const thumbImg = card.querySelector('.thumb');
      const thumbSrc = thumbImg ? thumbImg.src : 'assets/logo.png';
      prepareGame(encodeURIComponent(folder), encodeURIComponent(gameName), thumbSrc);
    }
  } else if (hash.startsWith('#/category/')) {
    const category = decodeURIComponent(hash.replace('#/category/', ''));
    closeGame();
    filterCategory(category, false); // Don't update URL since we're already routing
  } else {
    closeGame();
    filterCategory('Home', false); // Don't update URL since we're already routing
  }
}

// On window resize
let resizeTimeout = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    updateAllCategories();
  }, 120);
});

// Initial load
document.addEventListener('DOMContentLoaded', () => {
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
      this.src = 'assets/logo.png';
      const container = this.closest('.thumb-container');
      if (container) {
        container.style.setProperty('--thumb-url', "url('assets/logo.png')");
      }
    };
  });

  loadRecentlyPlayed();
  updateAllCategories();
  handleRouting();
  window.addEventListener('hashchange', handleRouting);
});
