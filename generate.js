const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "data");
const gamesDir = path.join(__dirname, "games");
const outputDir = path.join(__dirname, "dist");
const outputFile = path.join(outputDir, "index.html");

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// Read JSON files
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

// Group games by category
const categories = { "All Games": games };
games.forEach(g => {
  if (!categories[g.category]) categories[g.category] = [];
  categories[g.category].push(g);
});

// Generate HTML
const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Arcade</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');

* {
  box-sizing: border-box;
}
body {
  font-family: 'Orbitron', sans-serif;
  margin: 0;
  background: #1c0033;
  color: #eee;
  overflow-x: hidden;
  display: flex;
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
#sidebar:hover {
  width: 250px;
}
#sidebar header {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}
#sidebar header img {
  height: 60px;
  width: auto;
}
#sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
#sidebar li {
  cursor: pointer;
  padding: 0.5rem 0.5rem;
  border-radius: 4px;
  transition: 0.3s ease;
  white-space: nowrap;
  font-size: 16px;
  opacity: 0;
  transform: translateY(5px);
  text-align: left;
}
#sidebar:hover li {
  opacity: 1;
  transform: translateY(0);
}
#sidebar li:hover {
  background: #660099;
  box-shadow: 0 0 10px #ff99ff;
  color: #fff;
}

/* Content */
#content {
  flex: 1;
  padding: 1rem;
  overflow: auto;
  margin-left: 60px;
  transition: margin-left 0.3s;
}

/* Game Viewer */
.viewer {
  width: 100%;
  max-width: 1280px;
  height: 720px;
  display: none;
  flex-direction: column;
  margin: 0 auto 2rem auto;
  background: black;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}
#controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  visibility: hidden;
}
button {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
#backBtn {
  background: #ff99ff;
  color: black;
}
#fullscreenBtn {
  background: #cc66ff;
  color: black;
}
iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  overflow: hidden;
}

/* Game cards */
.category {
  margin-bottom: 2rem;
}
.category h2 {
  color: #ffccff;
  cursor: pointer;
  margin-bottom: 0.5rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}
.card {
  background: #4d0066;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform .2s;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.card:hover {
  transform: scale(1.05);
  background: #660099;
}
.thumb {
  width: 180px;
  height: 120px;
  object-fit: cover;
  margin-bottom: 0.5rem;
  border-radius: 6px;
  background: #330033;
}
</style>
</head>
<body>

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
    <iframe id="gameFrame" src=""></iframe>
  </div>

  <div id="allGames">
    ${Object.keys(categories).map(cat => `
      <div class="category" data-category="${cat}">
        <h2 onclick="filterCategory('${cat}')">${cat}</h2>
        <div class="grid">
          ${categories[cat].map(g => {
            const thumb = g.thumbs.find(t => fs.existsSync(path.join(gamesDir, g.folder, t))) || g.thumbs[0];
            return `
              <div class="card" onclick="openGame('${encodeURIComponent(g.folder)}', '${encodeURIComponent(g.name)}')">
                <img class="thumb" src="games/${g.folder}/${thumb}" alt="${g.name}">
                <div>${g.name}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('')}
  </div>
</div>

<script>
const viewer = document.getElementById('viewer');
const frame = document.getElementById('gameFrame');
const gameTitle = document.getElementById('gameTitle');
const controls = document.getElementById('controls');

if (window.location.pathname === '/' || window.location.pathname === '') {
  window.location.replace(window.location.origin + '/main');
}

function openGame(folderEncoded, nameEncoded) {
  const folder = decodeURIComponent(folderEncoded);
  const name = decodeURIComponent(nameEncoded);
  frame.src = 'games/' + folder + '/index.html';
  viewer.style.display = 'flex';
  controls.style.visibility = 'visible';
  gameTitle.textContent = name;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  window.location.hash = '#/game/' + folderEncoded;
  filterCategory('All Games');
}

function closeGame() {
  frame.src = '';
  viewer.style.display = 'none';
  controls.style.visibility = 'hidden';
  gameTitle.textContent = '';
  window.location.hash = '';
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

// Hash router
window.addEventListener('load', handleRouting);
window.addEventListener('hashchange', handleRouting);

function handleRouting() {
  const hash = window.location.hash;
  if (hash.startsWith('#/game/')) {
    const folder = hash.replace('#/game/', '');
    const card = [...document.querySelectorAll('.card')].find(el => el.getAttribute('onclick')?.includes(folder));
    if (card) {
      const name = card.querySelector('div').innerText;
      openGame(folder, encodeURIComponent(name));
    }
  } else {
    closeGame();
  }
}

filterCategory('All Games');

// Block page scrolling with arrows and space
window.addEventListener('keydown', e => {
  const blocked = [' ', 'ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
  if (blocked.includes(e.key)) e.preventDefault();
});
</script>

</body>
</html>
`;

fs.writeFileSync(outputFile, html);
console.log(`✅ Generated arcade with button hiding, space fix, and stretchable game viewer`);
