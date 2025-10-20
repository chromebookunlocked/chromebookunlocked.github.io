// generate.js
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "data");
const gamesDir = path.join(__dirname, "games");
const outputDir = path.join(__dirname, "dist");
const outputFile = path.join(outputDir, "index.html");

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

let games = fs.readdirSync(dataDir)
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

const categories = { "All Games": games };
games.forEach(g => {
  if (!categories[g.category]) categories[g.category] = [];
  categories[g.category].push(g);
});

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Chromebook Unlocked Games</title>
<link rel="icon" type="image/png" href="assets/logo.png">

<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1033412505744705" crossorigin="anonymous"></script>
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
  transition: width 0.3s ease;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
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
  font-size: 1em;
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

/* Game Viewer */
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
  transform: scale(1);
  transform-origin: top center;
}

.viewer::before {
  content: "";
  display: block;
  padding-top: 56.25%; /* 16:9 */
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
  overflow: hidden;
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

/* Transparent More Card */
.card.more {
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  color: #ffccff;
}

/* Scrollbar */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-thumb { background: #660099; border-radius: 4px; }

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
  <header>
    <img src="assets/logo.png" alt="Logo">
  </header>
<ul id="categoryList">
  <li onclick="filterCategory('Home')">Home</li>
  ${Object.keys(categories)
    .filter(cat => cat !== 'All Games') // exclude "All Games"
    .map(cat => `<li onclick="filterCategory('${cat}')">${cat}</li>`).join('')}
</ul>


</div>

<!-- Content -->
<div id="content">
  <div id="controls">
    <button id="backBtn" onclick="closeGame()">← Back</button>
    <span id="gameTitle"></span>
    <button id="fullscreenBtn" onclick="toggleFullscreen()">⛶ Fullscreen</button>
  </div>

  <!-- Viewer -->
  <div class="viewer" id="viewer">
    <div id="startOverlay">
      <img id="startThumb" src="" alt="Game Thumbnail">
      <h1 id="startName"></h1>
      <button id="startButton" onclick="startGame()">▶ Play</button>
    </div>
    <iframe id="gameFrame" src=""></iframe>
  </div>

  <!-- Recently Played (empty, JS fills it) -->
  <div class="category" data-category="Recently Played" id="recentlyPlayedSection" style="display:none;">
    <h2 onclick="filterCategory('Recently Played')">Recently Played</h2>
    <div class="grid" id="recentlyPlayedGrid"></div>
  </div>

<div class="category" data-category="Home">
  <h2>Home</h2>
  <div class="grid">
    ${games.map(g => {
      const thumb = g.thumbs.find(t => fs.existsSync(path.join(gamesDir, g.folder, t))) || g.thumbs[0];
      return `
        <div class="card" onclick="prepareGame('${encodeURIComponent(g.folder)}', '${encodeURIComponent(g.name)}', 'games/${g.folder}/${thumb}')">
          <img class="thumb" src="games/${g.folder}/${thumb}" alt="${g.name}">
          <div>${g.name}</div>
        </div>
      `;
    }).join('')}
  </div>
</div>


<script>
const viewer = document.getElementById('viewer');
const frame = document.getElementById('gameFrame');
const gameTitle = document.getElementById('gameTitle');
const controls = document.getElementById('controls');
const startOverlay = document.getElementById('startOverlay');
const startThumb = document.getElementById('startThumb');
const startName = document.getElementById('startName');
const recentlyPlayedGrid = document.getElementById('recentlyPlayedGrid');
let currentGameFolder = null;

const MAX_RECENT = 12;

function loadRecentlyPlayed() {
  const list = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
  updateRecentlyPlayedUI(list);
}

function saveRecentlyPlayed(game) {
  let list = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
  list = list.filter(g => g.folder !== game.folder);
  list.unshift(game);
  if (list.length > MAX_RECENT) list = list.slice(0, MAX_RECENT);
  localStorage.setItem('recentlyPlayed', JSON.stringify(list));
  updateRecentlyPlayedUI(list);
}

function updateRecentlyPlayedUI(list) {
  recentlyPlayedGrid.innerHTML = '';
  if (list.length === 0) {
    document.getElementById('recentlyPlayedSection').style.display = 'none';
    return;
  }
  document.getElementById('recentlyPlayedSection').style.display = 'block';

  list.forEach(g => {
    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = () => prepareGame(encodeURIComponent(g.folder), encodeURIComponent(g.name), g.thumb);
    card.innerHTML = \`<img class="thumb" src="\${g.thumb}" alt="\${g.name}"><div>\${g.name}</div>\`;
    recentlyPlayedGrid.appendChild(card);
  });

  // Three dots card
  const moreCard = document.createElement('div');
  moreCard.className = 'card more';
  moreCard.textContent = '⋯';
  moreCard.onclick = () => filterCategory('Recently Played');
  recentlyPlayedGrid.appendChild(moreCard);
}

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
  filterCategory('All Games');
  document.getElementById('content').scrollTop = 0;

  // Save to recently played
  saveRecentlyPlayed({ folder, name, thumb: thumbSrc });
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
  history.replaceState({}, '', '/');
}

function toggleFullscreen() {
  if (!document.fullscreenElement) frame.requestFullscreen().catch(e=>console.log(e));
  else document.exitFullscreen();
}

function filterCategory(cat) {
  const allCategories = document.querySelectorAll('.category');
  allCategories.forEach(c => {
    if (cat === 'Home') {
      c.style.display = 'block';
      document.getElementById('recentlyPlayedSection').style.display = recentlyPlayedGrid.children.length ? 'block' : 'none';
    } else {
      c.style.display = (c.getAttribute('data-category') === cat) ? 'block' : 'none';
    }
  });
}
filterCategory('Home');
loadRecentlyPlayed();

window.addEventListener('load', handleRouting);
window.addEventListener('hashchange', handleRouting);
function handleRouting() {
  const hash = window.location.hash;
  if (hash.startsWith('#/game/')) {
    const folder = decodeURIComponent(hash.replace('#/game/', ''));
    const card = [...document.querySelectorAll('.card')].find(el => el.getAttribute('onclick')?.includes(encodeURIComponent(folder)));
    if (card) {
      const name = card.querySelector('div').innerText;
      const thumb = card.querySelector('img').src;
      prepareGame(encodeURIComponent(folder), encodeURIComponent(name), thumb);
    }
  } else {
    closeGame();
  }
}

// Prevent arrow keys / space scrolling
window.addEventListener('keydown', e => {
  const blocked = [' ', 'ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
  if (blocked.includes(e.key)) e.preventDefault();
});
</script>
</body>
</html>
`;

// --- Generate sitemap.xml ---
const sitemapFile = path.join(outputDir, "sitemap.xml");
const baseURL = "https://chromebookunlocked.github.io";
const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseURL}/</loc></url>
</urlset>`;
fs.writeFileSync(sitemapFile, sitemapContent);
console.log(`✅ Sitemap generated`);

fs.writeFileSync(outputFile, html);
console.log(`✅ Responsive layout + Recently Played category added`);
