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
    const folder = json.folder || f.replace(".json", "");
    const thumb = json.thumbs && json.thumbs.length ? json.thumbs.find(t => fs.existsSync(path.join(gamesDir, folder, t))) : null;
    return {
      folder,
      name: json.name || folder,
      category: json.category || "Uncategorized",
      thumb: thumb || "thumbnail.png"
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
<title>Arcade</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { margin:0; font-family:sans-serif; background:#1c0033; color:#eee; display:flex; overflow-x:hidden; }
  /* Sidebar overlay minimized */
  #sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    background: #330066;
    width: 60px;
    padding: 0.5rem;
    overflow-y: auto;
    transition: width 0.3s ease;
    z-index: 10;
  }
  #sidebar:hover {
    width: 240px;
  }
  #sidebar header {
    display: flex;
    justify-content: center;
    padding: 0.5rem 0;
  }
  #sidebar header img {
    height: 50px;
    max-width: 100%;
  }
  #categoryList {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  #categoryList li {
    padding: 0.6rem 0.5rem;
    cursor: pointer;
    white-space: nowrap;
    border-radius: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: background 0.2s;
  }
  #categoryList li:hover {
    background: #660099;
  }

  #content {
    flex: 1;
    padding: 1rem;
    margin-left: 60px; /* so content is not under sidebar */
    transition: margin-left 0.3s;
  }

  /* Viewer layout */
  .viewer {
    display: none;
    margin-bottom: 2rem;
    display: flex;
    gap: 1rem;
    position: relative;
  }

  #gameFrame {
    background: black;
    width: 800px;
    height: 600px;
    border: none;
    border-radius: 8px;
    flex-shrink: 0;
  }

  #thumbColumn {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 600px;
    overflow-y: auto;
  }

  #thumbColumn img {
    width: 120px;
    height: 80px;
    object-fit: cover;
    border-radius: 6px;
    background: #330033;
  }

  #controls {
    position: absolute;
    top: -40px;
    left: 0;
    display: flex;
    gap: 0.5rem;
  }
  #controls button {
    background: #cc66ff;
    color: black;
    padding: 0.3rem 0.8rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }
  #backBtn {
    background: #ff99ff;
  }

  /* Game cards */
  .category { margin-bottom: 2rem; }
  .category h2 { color:#ffccff; cursor:pointer; margin-bottom:0.5rem; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:1rem; }
  .card { background:#4d0066; border-radius:8px; overflow:hidden; cursor:pointer; transition:transform .2s; display:flex; flex-direction:column; align-items:center; }
  .card:hover { transform:scale(1.05); background:#660099; }
  .thumb { width:180px; height:120px; object-fit:cover; margin-bottom:0.5rem; border-radius:6px; background:#330033; }
</style>
</head>
<body>

<div id="sidebar">
  <header>
    <img src="assets/logo.png" alt="Logo">
  </header>
  <ul id="categoryList">
    ${Object.keys(categories).map(cat => `<li onclick="filterCategory('${cat}')">${cat}</li>`).join('')}
  </ul>
</div>

<div id="content">
  <div class="viewer" id="viewer">
    <div id="controls">
      <button id="backBtn" onclick="closeGame()">← Back</button>
      <button onclick="toggleFullscreen()">⛶ Fullscreen</button>
    </div>
    <iframe id="gameFrame" src=""></iframe>
    <div id="thumbColumn"></div>
  </div>

  <div id="allGames">
    ${Object.keys(categories).map(cat => `
      <div class="category" data-category="${cat}">
        <h2 onclick="filterCategory('${cat}')">${cat}</h2>
        <div class="grid">
          ${categories[cat].map(g => `
            <div class="card" onclick="openGame('${g.folder}')">
              <img class="thumb" src="games/${g.folder}/${g.thumb}" alt="${g.name}">
              <div>${g.name}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')}
  </div>
</div>

<script>
const viewer = document.getElementById('viewer');
const frame = document.getElementById('gameFrame');
const thumbColumn = document.getElementById('thumbColumn');

function openGame(folder) {
  frame.src = 'games/' + folder + '/index.html';
  viewer.style.display = 'flex';
  // Show All Games under
  filterCategory('All Games');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Load thumbnails in column
  thumbColumn.innerHTML = '';
  const formats = ['png','jpg','jpeg','webp'];
  formats.forEach(ext => {
    const img = new Image();
    img.src = 'games/' + folder + '/thumbnail.' + ext;
    img.onload = () => thumbColumn.appendChild(img);
  });
}

function closeGame() {
  frame.src = '';
  viewer.style.display = 'none';
  thumbColumn.innerHTML = '';
}

function toggleFullscreen() {
  if (!document.fullscreenElement) viewer.requestFullscreen().catch(e=>console.log(e));
  else document.exitFullscreen();
}

function filterCategory(cat) {
  document.querySelectorAll('.category').forEach(c => {
    if (cat === 'All Games') {
      c.style.display = (c.getAttribute('data-category') === 'All Games') ? 'block' : 'none';
    } else {
      c.style.display = (c.getAttribute('data-category') === cat) ? 'block' : 'none';
    }
  });
}

// prevent scroll with arrow keys / space when in game view
window.addEventListener('keydown', e => {
  const blocked = [' ', 'ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
  if (viewer.style.display === 'flex' && blocked.includes(e.key)) e.preventDefault();
});

// Start with All Games
filterCategory('All Games');
</script>

</body>
</html>
`;

fs.writeFileSync(outputFile, html);
console.log(`✅ Generated site with ${games.length} games, overlay sidebar, fixed game window, right-side thumbnails and categories.`);
