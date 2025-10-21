const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "data");
const gamesDir = path.join(__dirname, "games");
const outputDir = path.join(__dirname, "dist");
const outputFile = path.join(outputDir, "index.html");

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// Load games
const games = fs.readdirSync(dataDir)
  .filter(f => f.endsWith(".json"))
  .map(f => {
    const json = JSON.parse(fs.readFileSync(path.join(dataDir, f)));
    return {
      folder: json.folder || f.replace(".json", ""),
      name: json.name || f.replace(".json", ""),
      category: json.category || "Uncategorized",
      thumbs: json.thumbs && json.thumbs.length ? json.thumbs : ["thumbnail.png", "thumbnail.jpg"]
    };
  });

// Build categories
const categories = {};
games.forEach(g => {
  if (!categories[g.category]) categories[g.category] = [];
  categories[g.category].push(g);
});

// Helper function to generate game card HTML
const generateGameCard = (game) => {
  const thumb = game.thumbs.find(t => fs.existsSync(path.join(gamesDir, game.folder, t))) || game.thumbs[0];
  return `
    <div class="card" onclick="prepareGame('${encodeURIComponent(game.folder)}','${encodeURIComponent(game.name)}','games/${game.folder}/${thumb}')">
      <img class="thumb" src="games/${game.folder}/${thumb}" alt="${game.name}">
      <div>${game.name}</div>
    </div>`;
};

// Generate category sections for individual category view
const categorySections = Object.keys(categories)
  .map(cat => `
    <div class="category" data-category="${cat}" style="display:none;">
      <h2>${cat}</h2>
      <div class="grid full-grid">
        ${categories[cat].map(generateGameCard).join('')}
      </div>
    </div>`).join('');

// Generate home page category rows (expandable)
const homeCategorySections = Object.keys(categories)
  .map(cat => `
    <div class="category home-category" data-category="${cat}" data-home-cat="${cat}">
      <h2 onclick="filterCategory('${cat}')" style="cursor:pointer;">${cat}</h2>
      <div class="grid row-grid" id="homeGrid-${cat}"></div>
    </div>`).join('');

// Generate sidebar categories (including All Games)
const sidebarCategories = `<li onclick="filterCategory('All Games')">All Games</li>` + 
  Object.keys(categories)
  .filter(cat => cat !== "Recently Played")
  .map(cat => `<li onclick="filterCategory('${cat}')">${cat}</li>`)
  .join("");

// Build complete HTML
const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Chromebook Unlocked Games</title>
<link rel="icon" type="image/png" href="assets/logo.png">
<style>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');

:root {
  --base-font: clamp(12px, 1.2vw, 18px);
  --thumb-height: clamp(100px, 20vh, 160px);
  --sidebar-width: clamp(50px, 6vw, 70px);
}

* { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  background: #1c0033;
  font-family: 'Orbitron', sans-serif;
  color: #eee;
  overflow: hidden;
  font-size: var(--base-font);
}

/* Sidebar */
#sidebar {
  width: var(--sidebar-width);
  background: #330066;
  padding: 1rem 0;
  height: 100vh;
  overflow-y: auto;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  transition: width 0.3s ease;
}
#sidebar:hover { width: 250px; }
#sidebar header { display: flex; justify-content: center; margin-bottom: 2rem; }
#sidebar header img { height: 60px; width: auto; }
#sidebar ul { list-style: none; padding: 0; margin: 0; }
#sidebar li {
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: 0.3s ease;
  white-space: nowrap;
  opacity: 0;
  transform: translateY(5px);
}
#sidebar:hover li { opacity: 1; transform: translateY(0); }
#sidebar li:hover {
  background: #660099;
  box-shadow: 0 0 10px #ff99ff;
  color: #fff;
}

/* Content */
#content {
  padding: 1rem;
  overflow-y: auto;
  overflow-x: hidden;
  margin-left: var(--sidebar-width);
  width: calc(100% - var(--sidebar-width));
  transition: margin-left 0.3s;
  height: 100vh;
}

/* Controls */
#controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1280px;
  margin: 0 auto 0.5rem auto;
  padding: 0.5rem;
  visibility: hidden;
  font-size: 1.2em;
}
button {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1em;
}
#backBtn { background: #ff99ff; color: black; }
#fullscreenBtn { background: #cc66ff; color: black; }

/* Viewer */
.viewer {
  position: relative;
  display: none;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto 2rem auto;
  background: transparent;
  border-radius: 10px;
  overflow: hidden;
}
.viewer::before {
  content: "";
  display: block;
  padding-top: 56.25%;
}
.viewer iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  object-fit: contain;
}

/* Overlay for Play */
#startOverlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #330066 0%, #1c0033 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  z-index: 10;
  transition: opacity 0.5s ease;
}
#startOverlay img {
  width: clamp(200px, 40vw, 300px);
  max-width: 80%;
  border-radius: 10px;
  box-shadow: 0 0 20px #ff99ff;
}
#startOverlay h1 {
  margin: 0;
  font-size: clamp(1.5rem, 2.5vw, 3rem);
  color: #fff;
}
#startButton {
  padding: 0.8rem 2rem;
  font-size: clamp(1rem, 1.5vw, 1.5rem);
  background: #ff99ff;
  color: black;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s;
}
#startButton:hover {
  background: #ff66ff;
  box-shadow: 0 0 15px #ff66ff;
}

/* Game Grid */
.category { margin-top: 2rem; }
.category h2 {
  color: #ffccff;
  margin-bottom: 0.5rem;
}
.grid {
  display: grid;
  gap: 1rem;
  justify-content: center;
}

/* Full grid for category/all games pages */
.full-grid {
  grid-template-columns: repeat(auto-fill, minmax(clamp(140px, 18vw, 220px), 1fr));
}

/* Row grid for home page - single row with expand button */
.row-grid {
  grid-template-columns: repeat(auto-fill, minmax(clamp(140px, 18vw, 220px), 1fr));
  grid-auto-rows: minmax(var(--thumb-height), auto);
  max-height: calc(var(--thumb-height) + 3rem);
  overflow: hidden;
  transition: max-height 0.3s ease;
}
.row-grid.expanded {
  max-height: none;
}

.card {
  background: #4d0066;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform .2s;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.card:hover { transform: scale(1.05); background: #660099; }
.thumb {
  width: 100%;
  height: var(--thumb-height);
  object-fit: cover;
  margin-bottom: 0.5rem;
  border-radius: 6px;
  background: #330033;
}
.card.more {
  background: rgba(255,255,255,0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  color: #ffccff;
  min-height: var(--thumb-height);
}

/* DMCA */
#dmcaLink {
  position: fixed;
  bottom: 10px;
  right: 10px;
  background: #ff66ff;
  color: black;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
  text-decoration: none;
  z-index: 10000;
  transition: 0.2s;
}
#dmcaLink:hover { background: #ff99ff; color: black; }
</style>
</head>
<body>
<a href="dmca.html" id="dmcaLink" target="_blank">DMCA</a>

<!-- Sidebar -->
<div id="sidebar">
  <header><img src="assets/logo.png" alt="Logo"></header>
  <ul id="categoryList">
    <li onclick="filterCategory('Home')">Home</li>
    ${sidebarCategories}
  </ul>
</div>

<!-- Content -->
<div id="content">
  <div id="controls">
    <button id="backBtn" onclick="closeGame()">← Back</button>
    <span id="gameTitle"></span>
    <button id="fullscreenBtn" onclick="toggleFullscreen()">⛶ Fullscreen</button>
  </div>

  <div class="viewer" id="viewer">
    <div id="startOverlay">
      <img id="startThumb" src="" alt="Game Thumbnail">
      <h1 id="startName"></h1>
      <button id="startButton" onclick="startGame()">▶ Play</button>
    </div>
    <iframe id="gameFrame" src=""></iframe>
  </div>

  <!-- Recently Played (Home View) -->
  <div class="category home-category" data-category="Recently Played" data-home-cat="Recently Played" id="recentlyPlayedSection" style="display:none;">
    <h2>Recently Played</h2>
    <div class="grid row-grid" id="recentlyPlayedGrid"></div>
  </div>

  <!-- Home Page Categories (Expandable Rows) -->
  <div id="homeCategories">
    ${homeCategorySections}
  </div>

  <!-- All Games (Full View) -->
  <div class="category" data-category="All Games" style="display:none;">
    <h2>All Games</h2>
    <div class="grid full-grid">
      ${games.map(generateGameCard).join('')}
    </div>
  </div>

  <!-- Individual Category Pages (Full View) -->
  ${categorySections}

</div>

<script>
const viewer = document.getElementById('viewer');
const frame = document.getElementById('gameFrame');
const controls = document.getElementById('controls');
const gameTitle = document.getElementById('gameTitle');
const startOverlay = document.getElementById('startOverlay');
const startThumb = document.getElementById('startThumb');
const startName = document.getElementById('startName');
const recentlyPlayedGrid = document.getElementById('recentlyPlayedGrid');
const homeCategories = document.getElementById('homeCategories');
let currentGameFolder = null;
const MAX_RECENT = 25;

// All games data
const allGames = ${JSON.stringify(games.map(g => ({
  folder: g.folder,
  name: g.name,
  category: g.category,
  thumb: g.thumbs.find(t => fs.existsSync(path.join(gamesDir, g.folder, t))) || g.thumbs[0]
})))};

const gamesByCategory = ${JSON.stringify(categories)};

// Calculate items per row based on grid
function getItemsPerRow() {
  const container = document.querySelector('.grid');
  if (!container) return 7;
  const containerWidth = container.offsetWidth;
  const minWidth = 140;
  return Math.floor(containerWidth / (minWidth + 16)) || 7;
}

// Utility to check if game exists
function gameExists(folder) {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('HEAD', 'games/' + folder + '/index.html', false);
    xhr.send();
    return xhr.status !== 404;
  } catch { return false; }
}

// Create game card element
function createGameCard(game) {
  const card = document.createElement('div');
  card.className = 'card';
  card.onclick = () => prepareGame(encodeURIComponent(game.folder), encodeURIComponent(game.name), 'games/' + game.folder + '/' + game.thumb);
  card.innerHTML = \`<img class="thumb" src="games/\${game.folder}/\${game.thumb}" alt="\${game.name}"><div>\${game.name}</div>\`;
  return card;
}

// Create expand/collapse button
function createMoreCard(categoryName, gridElement) {
  const moreCard = document.createElement('div');
  moreCard.className = 'card more';
  moreCard.textContent = '⋯';
  moreCard.onclick = () => {
    if (gridElement.classList.contains('expanded')) {
      gridElement.classList.remove('expanded');
      moreCard.textContent = '⋯';
    } else {
      gridElement.classList.add('expanded');
      moreCard.textContent = '−';
    }
  };
  return moreCard;
}

// Populate home category row
function populateHomeCategory(categoryName, games, gridElement) {
  gridElement.innerHTML = '';
  if (!games || games.length === 0) return;
  
  const itemsPerRow = getItemsPerRow();
  const displayGames = games.slice(0, itemsPerRow - 1);
  
  displayGames.forEach(game => {
    gridElement.appendChild(createGameCard(game));
  });
  
  if (games.length > itemsPerRow - 1) {
    gridElement.appendChild(createMoreCard(categoryName, gridElement));
  }
  
  // Add remaining games (hidden initially)
  if (games.length > itemsPerRow - 1) {
    games.slice(itemsPerRow - 1).forEach(game => {
      gridElement.appendChild(createGameCard(game));
    });
  }
}

// Load Recently Played, removing missing games
function loadRecentlyPlayed() {
  let list = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
  list = list.filter(g => gameExists(g.folder));
  localStorage.setItem('recentlyPlayed', JSON.stringify(list));
  updateRecentlyPlayedUI(list);
}

// Save game to Recently Played
function saveRecentlyPlayed(game) {
  let list = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
  list = list.filter(g => g.folder !== game.folder);
  list.unshift(game);
  if (list.length > MAX_RECENT) list = list.slice(0, MAX_RECENT);
  list = list.filter(g => gameExists(g.folder));
  localStorage.setItem('recentlyPlayed', JSON.stringify(list));
  updateRecentlyPlayedUI(list);
}

// Update Recently Played UI
function updateRecentlyPlayedUI(list) {
  const section = document.getElementById('recentlyPlayedSection');
  if (!list || list.length === 0) {
    section.style.display = 'none';
    return;
  }
  section.style.display = 'block';
  populateHomeCategory('Recently Played', list, recentlyPlayedGrid);
}

// Initialize home categories
function initHomeCategories() {
  Object.keys(gamesByCategory).forEach(cat => {
    const gridElement = document.getElementById('homeGrid-' + cat);
    if (gridElement) {
      const games = allGames.filter(g => g.category === cat);
      populateHomeCategory(cat, games, gridElement);
    }
  });
}

// Game functions
function prepareGame(folderEncoded, nameEncoded, thumbSrc) {
  const folder = decodeURIComponent(folderEncoded);
  const name = decodeURIComponent(nameEncoded);
  currentGameFolder = folder;
  frame.src = '';
  viewer.style.display = 'flex';
  controls.style.visibility = 'visible';
  gameTitle.textContent = name;
  startThumb.src = thumbSrc;
  startName.textContent = name;
  startOverlay.style.opacity = '1';
  startOverlay.style.pointerEvents = 'auto';
  window.location.hash = '#/game/' + folderEncoded;
  document.getElementById('content').scrollTop = 0;
  
  // Show only All Games grid when game is open
  document.querySelectorAll('.category').forEach(c => {
    const cat = c.getAttribute('data-category');
    c.style.display = cat === 'All Games' ? 'block' : 'none';
  });
  document.getElementById('homeCategories').style.display = 'none';
  
  saveRecentlyPlayed({ folder, name, thumb: thumbSrc.replace('games/' + folder + '/', '') });
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
  controls.style.visibility = 'hidden';
  gameTitle.textContent = '';
  currentGameFolder = null;
  startOverlay.style.opacity = '1';
  startOverlay.style.pointerEvents = 'auto';
  window.location.hash = '';
  filterCategory('Home');
}

function toggleFullscreen() {
  if (!document.fullscreenElement) frame.requestFullscreen().catch(()=>{});
  else document.exitFullscreen();
}

// Filter categories
function filterCategory(cat) {
  const all = document.querySelectorAll('.category');
  
  if (cat === 'Home') {
    // Show home view
    all.forEach(c => c.style.display = 'none');
    homeCategories.style.display = 'block';
    
    // Show home categories
    document.querySelectorAll('.home-category').forEach(c => c.style.display = 'block');
    
    updateRecentlyPlayedUI(JSON.parse(localStorage.getItem('recentlyPlayed') || '[]'));
  } else if (cat === 'All Games') {
    // Show All Games full grid
    all.forEach(c => {
      c.style.display = c.getAttribute('data-category') === 'All Games' ? 'block' : 'none';
    });
    homeCategories.style.display = 'none';
  } else {
    // Show specific category full grid
    all.forEach(c => {
      c.style.display = c.getAttribute('data-category') === cat ? 'block' : 'none';
    });
    homeCategories.style.display = 'none';
  }
  
  document.getElementById('content').scrollTop = 0;
}

// Hash routing
function handleRouting() {
  const hash = window.location.hash;
  if (hash.startsWith('#/game/')) {
    const folder = decodeURIComponent(hash.replace('#/game/', ''));
    const game = allGames.find(g => g.folder === folder);
    if (game) {
      prepareGame(encodeURIComponent(game.folder), encodeURIComponent(game.name), 'games/' + game.folder + '/' + game.thumb);
    }
  } else {
    closeGame();
    filterCategory('Home');
  }
}

// Initialize
filterCategory('Home');
loadRecentlyPlayed();
initHomeCategories();
window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', handleRouting);
window.addEventListener('resize', () => {
  if (window.location.hash === '' || window.location.hash === '#/') {
    initHomeCategories();
    updateRecentlyPlayedUI(JSON.parse(localStorage.getItem('recentlyPlayed') || '[]'));
  }
});

// Prevent arrow keys / space scrolling
window.addEventListener('keydown', e => {
  const blocked = [' ', 'ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
  if (blocked.includes(e.key)) e.preventDefault();
});
</script>
</body>
</html>
`;

fs.writeFileSync(outputFile, html);
console.log("✅ Build complete: index.html generated with Home, All Games, Recently Played and categories.");

// --- Sitemap ---
const sitemapFile = path.join(outputDir, "sitemap.xml");
const baseURL = "https://chromebookunlocked.github.io";
const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseURL}/</loc></url>
  <url><loc>${baseURL}/#/recent</loc></url>
</urlset>`;
fs.writeFileSync(sitemapFile, sitemapContent);
console.log("✅ Sitemap generated");
