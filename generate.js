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
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1033412505744705"
     crossorigin="anonymous"></script>
<meta charset="UTF-8">
<title>Arcade</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');

* { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  background: #1c0033;
  font-family: 'Orbitron', sans-serif;
  color: #eee;
  overflow: hidden; /* No global scrollbars - handled by content/sidebar */
}

/* Sidebar */
#sidebar {
  width: 60px;
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
  font-size: 16px;
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
  margin-left: 60px;
  width: calc(100% - 60px);
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
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
#backBtn { background: #ff99ff; color: black; }
#fullscreenBtn { background: #cc66ff; color: black; }

/* Game Viewer */
.viewer {
  position: relative;
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto 2rem auto;
  background: black;
  border-radius: 10px;
  overflow: hidden; /* hides anything overflowing inside the viewer */
}

.viewer iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: black;
  aspect-ratio: 16 / 9;
  object-fit: contain;
  overflow: hidden; /* Hides the iframe scrollbars */
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
  width: 300px;
  max-width: 80%;
  border-radius: 10px;
  box-shadow: 0 0 20px #ff99ff;
}
#startOverlay h1 {
  margin: 0;
  font-size: 2rem;
  color: #fff;
}
#startButton {
  padding: 0.8rem 2rem;
  font-size: 1.2rem;
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
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
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
  height: 140px;
  object-fit: cover;
  margin-bottom: 0.5rem;
  border-radius: 6px;
  background: #330033;
}

/* Hide Scrollbar visually */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-thumb { background: #660099; border-radius: 4px; }

/* DMCA Link */
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
#dmcaLink:hover {
  background: #ff99ff;
  color: black;
}
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
    ${Object.keys(categories).map(cat => `<li onclick="filterCategory('${cat}')">${cat}</li>`).join('')}
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

  ${Object.keys(categories).map(cat => `
    <div class="category" data-category="${cat}">
      <h2 onclick="filterCategory('${cat}')">${cat}</h2>
      <div class="grid">
        ${categories[cat].map(g => {
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
  `).join('')}
</div>

<script>
const viewer = document.getElementById('viewer');
const frame = document.getElementById('gameFrame');
const gameTitle = document.getElementById('gameTitle');
const controls = document.getElementById('controls');
const startOverlay = document.getElementById('startOverlay');
const startThumb = document.getElementById('startThumb');
const startName = document.getElementById('startName');
let currentGameFolder = null;

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
    if (cat === 'All Games') {
      c.style.display = (c.getAttribute('data-category') === 'All Games') ? 'block' : 'none';
    } else {
      c.style.display = (c.getAttribute('data-category') === cat) ? 'block' : 'none';
    }
  });
}

// Default category on load
filterCategory('All Games');

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
console.log(`✅ Cleaned & fixed layout — scrollable sidebar, scalable game window`);
