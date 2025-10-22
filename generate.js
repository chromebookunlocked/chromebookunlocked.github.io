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

// Generate individual category sections (for sidebar navigation)
const categorySections = Object.keys(categories)
  .filter(cat => cat !== "Recently Played")
  .map(cat => `
    <div class="category" data-category="${cat}" style="display:none;">
      <h2>${cat}</h2>
      <div class="grid">
        ${categories[cat].map(generateGameCard).join('')}
      </div>
    </div>`).join('');

// Generate sidebar categories
const sidebarCategories = Object.keys(categories)
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
  cursor: pointer;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(clamp(140px, 18vw, 220px), 1fr));
  gap: 1rem;
  justify-content: center;
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
    <li onclick="filterCategory('All Games')">All Games</li>
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

  <!-- Recently Played -->
  <div class="category" data-category="Recently Played" id="recentlyPlayedSection" style="display:none;">
    <h2>Recently Played</h2>
    <div class="grid" id="recentlyPlayedGrid"></div>
  </div>

  <!-- Home Page with Category Rows -->
  <div id="homeContainer" data-category="Home">
    <!-- Categories will be dynamically inserted here -->
  </div>

  <!-- All Games (Full Grid) -->
  <div class="category" data-category="All Games" style="display:none;">
    <h2>All Games</h2>
    <div class="grid">
      ${games.map(generateGameCard).join('')}
    </div>
  </div>

  <!-- Other Categories (Full Grids) -->
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
const homeContainer = document.getElementById('homeContainer');
let currentGameFolder = null;
const MAX_RECENT = 25;

// Store all games data for dynamic rendering
const allGames = ${JSON.stringify(games.map(g => {
  const thumb = g.thumbs.find(t => fs.existsSync(path.join(gamesDir, g.folder, t))) || g.thumbs[0];
  return {
    folder: g.folder,
    name: g.name,
    category: g.category,
    thumb: `games/${g.folder}/${thumb}`
  };
}))};

const categoriesData = ${JSON.stringify(categories)};

// Calculate how many cards fit in one row
function getCardsPerRow() {
  const contentWidth = document.getElementById('content').offsetWidth;
  const cardMinWidth = 140;
  const gap = 16;
  return Math.floor((contentWidth - gap) / (cardMinWidth + gap));
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

// Load Recently Played
function loadRecentlyPlayed() {
  let list = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
  list = list.filter(g => gameExists(g.folder));
  localStorage.setItem('recentlyPlayed', JSON.stringify(list));
  return list;
}

// Save game to Recently Played
function saveRecentlyPlayed(game) {
  let list = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
  list = list.filter(g => g.folder !== game.folder);
  list.unshift(game);
  if (list.length > MAX_RECENT) list = list.slice(0, MAX_RECENT);
  list = list.filter(g => gameExists(g.folder));
  localStorage.setItem('recentlyPlayed', JSON.stringify(list));
}

// Create a game card element
function createCard(game) {
  const card = document.createElement('div');
  card.className = 'card';
  card.onclick = () => prepareGame(encodeURIComponent(game.folder), encodeURIComponent(game.name), game.thumb);
  card.innerHTML = \`<img class="thumb" src="\${game.thumb}" alt="\${game.name}"><div>\${game.name}</div>\`;
  return card;
}

// Create a "more" card
function createMoreCard(categoryName, currentRow) {
  const moreCard = document.createElement('div');
  moreCard.className = 'card more';
  moreCard.textContent = '⋯';
  moreCard.onclick = () => expandCategory(categoryName, currentRow);
  return moreCard;
}

// Expand a category to show next row
function expandCategory(categoryName, currentRow) {
  const categorySection = document.querySelector(\`[data-home-category="\${categoryName}"]\`);
  if (!categorySection) return;
  
  const grid = categorySection.querySelector('.grid');
  const cardsPerRow = getCardsPerRow();
  
  let games;
  if (categoryName === 'Recently Played') {
    games = loadRecentlyPlayed();
  } else {
    games = allGames.filter(g => g.category === categoryName);
  }
  
  const startIdx = (currentRow + 1) * cardsPerRow;
  const endIdx = Math.min(startIdx + cardsPerRow, games.length);
  const hasMore = endIdx < games.length;
  
  // Remove the old "more" card
  const oldMoreCard = grid.querySelector('.card.more');
  if (oldMoreCard) oldMoreCard.remove();
  
  // Add new cards
  for (let i = startIdx; i < endIdx; i++) {
    grid.appendChild(createCard(games[i]));
  }
  
  // Add new "more" card if needed
  if (hasMore) {
    grid.appendChild(createMoreCard(categoryName, currentRow + 1));
  }
}

// Render home page with category rows
function renderHomePage() {
  homeContainer.innerHTML = '';
  const cardsPerRow = getCardsPerRow();
  
  // Recently Played section
  const recentGames = loadRecentlyPlayed();
  if (recentGames.length > 0) {
    const recentSection = document.createElement('div');
    recentSection.className = 'category';
    recentSection.setAttribute('data-home-category', 'Recently Played');
    recentSection.innerHTML = '<h2>Recently Played</h2><div class="grid"></div>';
    const grid = recentSection.querySelector('.grid');
    
    const displayCount = Math.min(cardsPerRow - 1, recentGames.length);
    const hasMore = recentGames.length > displayCount;
    
    for (let i = 0; i < displayCount; i++) {
      grid.appendChild(createCard(recentGames[i]));
    }
    
    if (hasMore) {
      grid.appendChild(createMoreCard('Recently Played', 0));
    }
    
    homeContainer.appendChild(recentSection);
  }
  
  // Category sections (excluding "Recently Played")
  Object.keys(categoriesData).forEach(catName => {
    if (catName === 'Recently Played') return;
    
    const catGames = allGames.filter(g => g.category === catName);
    if (catGames.length === 0) return;
    
    const catSection = document.createElement('div');
    catSection.className = 'category';
    catSection.setAttribute('data-home-category', catName);
    catSection.innerHTML = \`<h2>\${catName}</h2><div class="grid"></div>\`;
    const grid = catSection.querySelector('.grid');
    
    const displayCount = Math.min(cardsPerRow - 1, catGames.length);
    const hasMore = catGames.length > displayCount;
    
    for (let i = 0; i < displayCount; i++) {
      grid.appendChild(createCard(catGames[i]));
    }
    
    if (hasMore) {
      grid.appendChild(createMoreCard(catName, 0));
    }
    
    homeContainer.appendChild(catSection);
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
  saveRecentlyPlayed({ folder, name, thumb: thumbSrc });
  
  // Show only All Games grid when game is open
  filterCategory('All Games', true);
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
function filterCategory(cat, fromGameOpen = false) {
  const all = document.querySelectorAll('.category, #homeContainer');
  
  all.forEach(c => {
    const category = c.getAttribute('data-category') || c.getAttribute('data-home-category');
    
    if (cat === 'Home') {
      if (c.id === 'homeContainer') {
        c.style.display = 'block';
        if (!fromGameOpen) renderHomePage();
      } else {
        c.style.display = 'none';
      }
    } else if (cat === 'All Games') {
      if (category === 'All Games') {
        c.style.display = 'block';
      } else {
        c.style.display = 'none';
      }
    } else {
      if (category === cat) {
        c.style.display = 'block';
      } else {
        c.style.display = 'none';
      }
    }
  });
  
  document.getElementById('content').scrollTop = 0;
}

// Hash routing
function handleRouting() {
  const hash = window.location.hash;
  if (hash.startsWith('#/game/')) {
    const folder = decodeURIComponent(hash.replace('#/game/', ''));
    const game = allGames.find(g => g.folder === folder);
    if (game) {
      prepareGame(encodeURIComponent(game.folder), encodeURIComponent(game.name), game.thumb);
    }
  } else {
    closeGame();
    filterCategory('Home');
  }
}

// Initialize
filterCategory('Home');
window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', handleRouting);
window.addEventListener('resize', () => {
  if (homeContainer.style.display !== 'none') {
    renderHomePage();
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
