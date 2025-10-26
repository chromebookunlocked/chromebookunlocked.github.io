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

// Helper to generate game card HTML
const generateGameCard = (game) => {
  const thumb = game.thumbs.find(t => fs.existsSync(path.join(gamesDir, game.folder, t))) || game.thumbs[0];
  return `
    <div class="card" onclick="prepareGame('${encodeURIComponent(game.folder)}','${encodeURIComponent(game.name)}','games/${game.folder}/${thumb}')">
      <div class="thumb-container" style="--thumb-url: url('games/${game.folder}/${thumb}')">
        <img class="thumb" src="games/${game.folder}/${thumb}" alt="${game.name}">
      </div>
      <div class="card-title">${game.name}</div>
    </div>`;
};

// Generate category sections
const categorySections = Object.keys(categories)
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

// Build the HTML
const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Chromebook Unblocked Games – Free Online Games for School / Chrome</title>
  <meta name="description" content="Play free Chromebook unblocked games and school-friendly online games. Explore, browse, and launch unlocked games right from your browser.">
  <meta name="keywords" content="Chromebook unblocked, Chromebook unlocked, school unblocked games, online games, Chromebook games, unblocked games">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- Open Graph / Social Meta -->
  <meta property="og:title" content="Chromebook Unblocked Games">
  <meta property="og:description" content="Play free online games unlocked for Chromebook / school. Browse a large library of unblocked games directly in your browser.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://chromebookunlocked.github.io/">
  <meta property="og:image" content="https://chromebookunlocked.github.io/assets/logo.png">

  <link rel="icon" type="image/png" href="assets/logo.png">

  <style>
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');

    :root {
      --base-font: clamp(12px, 1.2vw, 18px);
      --thumb-height: clamp(140px, 18vw, 200px);
      --sidebar-width: clamp(50px, 6vw, 70px);
      --accent: #ff66ff;
      --accent-dark: #cc33ff;
      --background-dark: #1c0033;
      --font-main: 'Orbitron', sans-serif;
    }

    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      background: var(--background-dark);
      font-family: var(--font-main);
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
      font-family: var(--font-main);
    }
    #sidebar:hover li { opacity: 1; transform: translateY(0); }
    #sidebar li:hover {
      background: #660099;
      box-shadow: 0 0 10px var(--accent);
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
      font-size: 1.1em;
    }
    button {
      padding: 0.6rem 1rem;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-size: 1em;
      background: linear-gradient(135deg, var(--accent), var(--accent-dark));
      color: black;
      font-weight: 700;
      letter-spacing: 0.5px;
      transition: all 0.2s ease;
      box-shadow: 0 0 10px var(--accent);
      font-family: var(--font-main);
    }
    button:hover {
      transform: scale(1.05);
      box-shadow: 0 0 15px var(--accent);
    }
    #backBtn { background: linear-gradient(135deg, #ff99ff, var(--accent)); }
    #fullscreenBtn { background: linear-gradient(135deg, var(--accent-dark), #9933ff); }

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
      box-shadow: 0 0 20px var(--accent);
    }
    #startOverlay h1 {
      margin: 0;
      font-size: clamp(1.5rem, 2.5vw, 3rem);
      color: #fff;
      font-family: var(--font-main);
    }
    #startButton {
      padding: 0.8rem 2rem;
      font-size: clamp(1rem, 1.5vw, 1.5rem);
      background: var(--accent);
      color: black;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: 0.2s;
      font-weight: bold;
      font-family: var(--font-main);
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
      font-family: var(--font-main);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 1rem;
      justify-items: center;
    }
    @media (max-width: 1200px) { .grid { grid-template-columns: repeat(4, 1fr); } }
    @media (max-width: 900px)  { .grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 600px)  { .grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 400px)  { .grid { grid-template-columns: 1fr; } }

    .card {
      width: 100%;
      background: #4d0066;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: transform .2s, background .2s;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }
    .card:hover { transform: scale(1.05); background: #660099; }

    .thumb-container {
      width: 100%;
      height: var(--thumb-height);
      position: relative;
      overflow: hidden;
      border-radius: 8px;
      background: #220033;
    }
    .thumb-container::before {
      content: "";
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      filter: blur(20px) brightness(0.5);
      z-index: 0;
      transition: transform 0.2s ease;
      background-image: var(--thumb-url);
    }
    .thumb {
      position: relative;
      z-index: 1;
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: transform 0.3s ease;
    }
    .card:hover .thumb { transform: scale(1.05); }
    .card-title {
      margin: 0.5rem 0 1rem 0;
      font-family: var(--font-main);
    }

    /* DMCA link */
    #dmcaLink {
      position: fixed;
      bottom: 10px;
      right: 10px;
      background: var(--accent);
      color: black;
      padding: 0.3rem 0.6rem;
      border-radius: 6px;
      font-size: 0.8rem;
      text-decoration: none;
      z-index: 10000;
      transition: 0.2s;
      font-family: var(--font-main);
    }
    #dmcaLink:hover { background: #ff99ff; color: black; }

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
      <button id="recentBackBtn" onclick="backToHome()" style="display:none;">← Home</button>
    </div>

    <div class="viewer" id="viewer">
      <div id="startOverlay">
        <img id="startThumb" src="" alt="Game Thumbnail">
        <h1 id="startName"></h1>
        <button id="startButton" onclick="startGame()">▶ Play</button>
      </div>
      <iframe id="gameFrame" src=""></iframe>
    </div>

    <div class="category" data-category="Recently Played" id="recentlyPlayedSection" style="display:none;">
      <h2>Recently Played</h2>
      <div class="grid" id="recentlyPlayedGrid"></div>
    </div>

    <div class="category" data-category="Home">
      <h2>All Games</h2>
      <div class="grid">
        ${games.map(generateGameCard).join('')}
      </div>
    </div>

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
    let currentGameFolder = null;
    const MAX_RECENT = 25;

    // Load Recently Played
    function gameExists(folder) {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('HEAD', 'games/' + folder + '/index.html', false);
        xhr.send();
        return xhr.status !== 404;
      } catch { return false; }
    }

    function loadRecentlyPlayed() {
      let list = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
      list = list.filter(g => gameExists(g.folder));
      localStorage.setItem('recentlyPlayed', JSON.stringify(list));
      updateRecentlyPlayedUI(list, true);
    }

    function saveRecentlyPlayed(game) {
      let list = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
      list = list.filter(g => g.folder !== game.folder);
      list.unshift(game);
      if (list.length > MAX_RECENT) list = list.slice(0, MAX_RECENT);
      list = list.filter(g => gameExists(g.folder));
      localStorage.setItem('recentlyPlayed', JSON.stringify(list));
      updateRecentlyPlayedUI(list, true);
    }

    function updateRecentlyPlayedUI(list, homeView = false) {
      recentlyPlayedGrid.innerHTML = '';
      if (!list.length) {
        document.getElementById('recentlyPlayedSection').style.display = 'none';
        return;
      }
      document.getElementById('recentlyPlayedSection').style.display = 'block';

      const displayList = homeView ? list.slice(0,7) : list;
      displayList.forEach(g => {
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => prepareGame(encodeURIComponent(g.folder), encodeURIComponent(g.name), g.thumb);
        card.innerHTML = \`
          <div class="thumb-container" style="--thumb-url: url('\${g.thumb}')">
            <img class="thumb" src="\${g.thumb}" alt="\${g.name}">
          </div>
          <div class="card-title">\${g.name}</div>\`;
        recentlyPlayedGrid.appendChild(card);
      });

      if (homeView && list.length > 7) {
        const moreCard = document.createElement('div');
        moreCard.className = 'card more';
        moreCard.textContent = '⋯';
        moreCard.onclick = () => filterCategory('Recently Played');
        recentlyPlayedGrid.appendChild(moreCard);
      }
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
      document.getElementById('content').scrollTop = 0;
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
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) frame.requestFullscreen().catch(()=>{});
      else document.exitFullscreen();
    }

    function filterCategory(cat) {
      const all = document.querySelectorAll('.category');
      all.forEach(c => {
        const category = c.getAttribute('data-category');
        if (cat === 'Home') {
          c.style.display = (category === 'Home' || category === 'Recently Played') ? 'block' : 'none';
          updateRecentlyPlayedUI(JSON.parse(localStorage.getItem('recentlyPlayed') || '[]'), true);
          document.getElementById('recentBackBtn').style.display = 'none';
        } else if (cat === 'Recently Played') {
          c.style.display = 'block';
          updateRecentlyPlayedUI(JSON.parse(localStorage.getItem('recentlyPlayed') || '[]'), false);
          document.getElementById('recentBackBtn').style.display = 'inline-block';
        } else {
          c.style.display = category === cat ? 'block' : 'none';
          document.getElementById('recentBackBtn').style.display = 'none';
        }
      });
      document.getElementById('content').scrollTop = 0;
    }

    function backToHome() {
      filterCategory('Home');
    }

    function handleRouting() {
      const hash = window.location.hash;
      if (hash.startsWith('#/game/')) {
        const folder = decodeURIComponent(hash.replace('#/game/', ''));
        const card = [...document.querySelectorAll('.card')]
          .find(el => el.onclick && el.onclick.toString().includes(encodeURIComponent(folder)));
        if (card) card.click();
      } else {
        closeGame();
        filterCategory('Home');
      }
    }

    window.addEventListener('hashchange', handleRouting);
    loadRecentlyPlayed();
    handleRouting();

    // Prevent space / arrow from scrolling page
    window.addEventListener('keydown', e => {
      const blocked = [' ', 'ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
      if (blocked.includes(e.key)) e.preventDefault();
    });
  </script>
</body>
</html>
`;

fs.writeFileSync(outputFile, html);
console.log("✅ Build complete: index.html generated");

// Sitemap (only main page)
const sitemapFile = path.join(outputDir, "sitemap.xml");
const baseURL = "https://chromebookunlocked.github.io";
const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseURL}/</loc></url>
</urlset>`;
fs.writeFileSync(sitemapFile, sitemapContent);
console.log("✅ Sitemap generated (main page only)");

