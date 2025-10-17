const fs = require("fs");
const path = require("path");

// Paths
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
  body { font-family:sans-serif; margin:0; background:#1c0033; color:#eee; overflow-x:hidden; display:flex; }
  #sidebar { width:250px; background:#330066; padding:1rem; height:100vh; overflow-y:auto; transition: all 0.3s ease; position:relative; }
  #sidebar.collapsed { width:50px; }
  #sidebar header { display:flex; justify-content:center; margin-bottom:2rem; }
  #sidebar header img { height:60px; }
  #toggleBtn { position:absolute; top:50%; right:-15px; transform:translateY(-50%); background:#660099; color:#fff; border:none; border-radius:50%; width:30px; height:30px; cursor:pointer; font-size:18px; display:flex; align-items:center; justify-content:center; }
  #sidebar ul { list-style:none; padding:0; margin:0; }
  #sidebar li { cursor:pointer; padding:0.5rem 0.5rem; border-radius:4px; transition:0.2s; white-space:nowrap; }
  #sidebar li:hover { background:#660099; }
  #content { flex:1; padding:1rem; overflow:auto; }
  .category { margin-bottom:2rem; }
  .category h2 { color:#ffccff; cursor:pointer; margin-bottom:0.5rem; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:1rem; }
  .card { background:#4d0066; border-radius:8px; overflow:hidden; cursor:pointer; transition:transform .2s; display:flex; flex-direction:column; align-items:center; }
  .card:hover { transform:scale(1.05); background:#660099; }
  .thumb { width:180px; height:120px; object-fit:cover; margin-bottom:0.5rem; border-radius:6px; background:#330033; }
  .viewer { width:100%; height:70vh; display:flex; flex-direction:column; margin-bottom:2rem; display:none; }
  iframe { width:100%; height:100%; border:none; }
  #controls { display:flex; justify-content:space-between; margin-bottom:0.5rem; }
  button { padding:0.4rem 0.8rem; border:none; border-radius:6px; cursor:pointer; font-size:14px; }
  #backBtn { background:#ff99ff; color:black; }
  #fullscreenBtn { background:#cc66ff; color:black; }
</style>
</head>
<body>

<div id="sidebar">
  <header>
    <img src="logo.png" alt="Logo">
  </header>
  <button id="toggleBtn" onclick="toggleSidebar()" style="right:-10px">›</button>
  <ul id="categoryList">
    ${Object.keys(categories).map(cat => `<li onclick="filterCategory('${cat}')">${cat}</li>`).join('')}
  </ul>
</div>

<div id="content">
  <div class="viewer" id="viewer">
    <div id="controls">
      <button id="backBtn" onclick="closeGame()">← Back</button>
      <button id="fullscreenBtn" onclick="toggleFullscreen()">⛶ Fullscreen</button>
      <span id="gameTitle"></span>
    </div>
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
              <div class="card" onclick="openGame('${g.folder}')">
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
const backBtn = document.getElementById('backBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const gameTitle = document.getElementById('gameTitle');
const sidebar = document.getElementById('sidebar');

function openGame(folder) {
  frame.src = 'games/' + folder + '/index.html';
  viewer.style.display = 'flex';
  gameTitle.textContent = folder;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeGame() {
  frame.src = '';
  viewer.style.display = 'none';
}

function toggleFullscreen() {
  if (!document.fullscreenElement) frame.requestFullscreen().catch(e=>console.log(e));
  else document.exitFullscreen();
}

function toggleSidebar() {
  sidebar.classList.toggle('collapsed');
}

function filterCategory(cat) {
  const allCategories = document.querySelectorAll('.category');
  allCategories.forEach(c => {
    if (cat === 'All Games') {
      // Show only the All Games section, hide others
      c.style.display = (c.getAttribute('data-category') === 'All Games') ? 'block' : 'none';
    } else {
      // Show only the selected category
      c.style.display = (c.getAttribute('data-category') === cat) ? 'block' : 'none';
    }
  });
}

// Show All Games by default
filterCategory('All Games');

// Prevent arrow keys / space from scrolling
window.addEventListener('keydown', e => {
  const blocked = [' ', 'ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
  if (blocked.includes(e.key)) e.preventDefault();
});
</script>

</body>
</html>
`;

fs.writeFileSync(outputFile, html);
console.log(`✅ Generated arcade with ${games.length} games, modern sidebar and All Games default`);
