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
      <div class="thumb-wrapper">
        <img class="thumb" src="games/${game.folder}/${thumb}" alt="${game.name}">
      </div>
      <div class="card-title">${game.name}</div>
    </div>`;
};

// Sidebar categories
const sidebarCategories = Object.keys(categories)
  .filter(cat => cat !== "Recently Played")
  .map(cat => `<li onclick="filterCategory('${cat}')">${cat}</li>`)
  .join("");

// Full HTML
const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Chromebook Unblocked Games | Play Free School Unblocked Games Online</title>
<meta name="description" content="Play Chromebook Unblocked Games online for free! Access school-friendly games that work on any Chromebook, laptop, or PC. No downloads, no blocks.">
<meta name="keywords" content="Chromebook unblocked, Chromebook unlocked, Chromebook unblocked games, school unblocked games, free online games, HTML5 unblocked games, Chromebook gaming">
<meta name="author" content="Chromebook Unlocked">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" type="image/png" href="assets/logo.png">
<meta property="og:title" content="Chromebook Unblocked Games">
<meta property="og:description" content="Play free unblocked games right on your Chromebook.">
<meta property="og:image" content="assets/logo.png">
<meta property="og:type" content="website">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://chromebookunlocked.github.io/">
<style>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');

:root {
  --base-font: clamp(12px, 1.2vw, 18px);
  --thumb-height: 160px;
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
}
button {
  font-family: 'Orbitron', sans-serif;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  background: linear-gradient(90deg, #660099, #ff99ff);
  color: black;
  font-weight: 700;
  font-size: 1rem;
  box-shadow: 0 0 10px #ff99ff;
  transition: 0.3s ease;
}
button:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px #ff66ff;
}

/* Viewer */
.viewer {
  position: relative;
  display: none;
  justify-content: center;
  align-items: center;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: transparent;
  border-radius: 10px;
  overflow: hidden;
  margin: 0 auto 2rem auto;
}
.viewer iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  object-fit: contain;
}

/* Overlay */
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
  border-radius: 10px;
  box-shadow: 0 0 20px #ff99ff;
}
#startOverlay h1 { color: #fff; }
#startButton {
  background: linear-gradient(90deg, #ff66ff, #cc33ff);
  color: black;
}

/* Grid */
.category {
  margin-top: 2rem;
}
.category h2 {
  color: #ffccff;
  margin-bottom: 0.5rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
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
.thumb-wrapper {
  position: relative;
  width: 100%;
  height: var(--thumb-height);
  overflow: hidden;
  border-radius: 6px;
  background: #330033;
}
.thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: none;
}
.thumb-wrapper::before {
  content: "";
  position: absolute;
  inset: 0;
  background: inherit;
  backdrop-filter: blur(20px);
  z-index: -1;
}
.card-title { padding: 0.4rem; }

.card.more {
  background: rgba(255,255,255,0.1);
  font-size: 2.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #ffccff;
  font-weight: bold;
  user-select: none;
}
.card.more:hover {
  background: rgba(255,255,255,0.2);
  transform: scale(1.05);
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
}
</style>
</head>
<body>
<a href="dmca.html" id="dmcaLink" target="_blank">DMCA</a>

<div id="sidebar">
  <header><img src="assets/logo.png" alt="Logo"></header>
  <ul id="categoryList">
    <li onclick="filterCategory('Home')">Home</li>
    ${sidebarCategories}
  </ul>
</div>

<div id="content">
  <div id="controls">
    <button id="backBtn" onclick="closeGame()">← Back</button>
    <span id="gameTitle"></span>
    <button id="fullscreenBtn" onclick="toggleFullscreen()">⛶ Fullscreen</button>
  </div>

  <div class="viewer" id="viewer">
    <div id="startOverlay">
      <img id="startThumb" src="" alt="">
      <h1 id="startName"></h1>
      <button id="startButton" onclick="startGame()">▶ Play</button>
    </div>
    <iframe id="gameFrame" src=""></iframe>
  </div>

  <div id="categoriesContainer"></div>
</div>

<script>
const viewer = document.getElementById('viewer');
const frame = document.getElementById('gameFrame');
const controls = document.getElementById('controls');
const startThumb = document.getElementById('startThumb');
const startName = document.getElementById('startName');
let currentGameFolder = null;

const categories = ${JSON.stringify(categories)};
const MAX_RECENT = 25;

function generateCardHTML(g) {
  return \`<div class="card" onclick="prepareGame('\${encodeURIComponent(g.folder)}','\${encodeURIComponent(g.name)}','games/\${g.folder}/thumbnail.png')">
      <div class="thumb-wrapper"><img class="thumb" src="games/\${g.folder}/thumbnail.png" alt="\${g.name}"></div>
      <div class="card-title">\${g.name}</div>
    </div>\`;
}

function buildHome() {
  const container = document.getElementById('categoriesContainer');
  container.innerHTML = '';
  Object.keys(categories).forEach(cat => {
    const section = document.createElement('div');
    section.className = 'category';
    section.setAttribute('data-category', cat);
    section.innerHTML = \`<h2>\${cat}</h2><div class="grid"></div>\`;
    container.appendChild(section);
    populateCategoryGrid(cat, section.querySelector('.grid'));
  });
}

function populateCategoryGrid(cat, grid) {
  const games = categories[cat];
  const visibleCount = getGamesPerRow();
  grid.innerHTML = '';
  const visibleGames = games.slice(0, visibleCount - 1);
  visibleGames.forEach(g => grid.innerHTML += generateCardHTML(g));
  if (games.length > visibleCount - 1) {
    const moreCard = document.createElement('div');
    moreCard.className = 'card more';
    moreCard.textContent = '⋯';
    moreCard.onclick = () => expandCategory(cat, grid, moreCard);
    grid.appendChild(moreCard);
  } else {
    games.slice(visibleCount - 1).forEach(g => grid.innerHTML += generateCardHTML(g));
  }
}

function expandCategory(cat, grid, moreCard) {
  const games = categories[cat];
  const perRow = getGamesPerRow();
  const currentCount = grid.querySelectorAll('.card:not(.more)').length;
  const nextGames = games.slice(currentCount, currentCount + perRow - 1);
  nextGames.forEach(g => grid.insertBefore(htmlToElement(generateCardHTML(g)), moreCard));
  if (currentCount + perRow - 1 >= games.length) moreCard.remove();
}

function htmlToElement(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstChild;
}

function getGamesPerRow() {
  const grid = document.createElement('div');
  grid.className = 'grid';
  document.body.appendChild(grid);
  const style = window.getComputedStyle(grid);
  const columns = Math.round(parseFloat(style.gridTemplateColumns.split(' ').length || 1));
  grid.remove();
  return columns || 5;
}

function prepareGame(folder, name, thumb) {
  currentGameFolder = decodeURIComponent(folder);
  startName.textContent = decodeURIComponent(name);
  startThumb.src = thumb;
  viewer.style.display = 'flex';
  controls.style.visibility = 'visible';
  frame.src = 'games/' + currentGameFolder + '/index.html';
}

function startGame() {
  if (!currentGameFolder) return;
  frame.src = 'games/' + currentGameFolder + '/index.html';
}

function closeGame() {
  frame.src = '';
  viewer.style.display = 'none';
  controls.style.visibility = 'hidden';
}

function toggleFullscreen() {
  if (!document.fullscreenElement) frame.requestFullscreen().catch(()=>{});
  else document.exitFullscreen();
}

function filterCategory(cat) {
  if (cat === 'Home') buildHome();
  else {
    document.getElementById('categoriesContainer').innerHTML = '';
    const section = document.createElement('div');
    section.className = 'category';
    section.innerHTML = '<h2>' + cat + '</h2><div class="grid"></div>';
    document.getElementById('categoriesContainer').appendChild(section);
    populateCategoryGrid(cat, section.querySelector('.grid'));
  }
}

window.addEventListener('resize', buildHome);
buildHome();
</script>
</body>
</html>
`;

fs.writeFileSync(outputFile, html);

// --- Sitemap ---
const sitemapFile = path.join(outputDir, "sitemap.xml");
const baseURL = "https://chromebookunlocked.github.io";
const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseURL}/</loc></url>
</urlset>`;
fs.writeFileSync(sitemapFile, sitemapContent);
console.log("✅ Build complete and SEO-optimized sitemap generated!");
