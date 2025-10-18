// ... same code above

// Generate HTML
const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Arcade</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; overflow: hidden; }
body {
  font-family: 'Orbitron', sans-serif;
  background: #1c0033;
  color: #eee;
  display: flex;
}

/* Sidebar — unchanged */
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

#content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  overflow-x: hidden;
  margin-left: 60px;
  transition: margin-left 0.3s;
}

/* Game viewer wrapper */
.viewer {
  width: 100%;
  display: none;
  flex-direction: column;
  align-items: center;
  margin: 0 auto 2rem auto;
  position: relative;
}

#controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 1280px;
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

/* Fixed 16:9 aspect ratio */
.viewer-inner {
  position: relative;
  width: 100%;
  max-width: 1280px;
  aspect-ratio: 16 / 9;
  background: black; /* fills corners with black */
  overflow: hidden;
  border-radius: 10px;
}

iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  overflow: hidden;
  background: black;
}
iframe::-webkit-scrollbar { display: none; }
iframe { scrollbar-width: none; }

/* Start overlay */
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

/* Game cards — unchanged */
.category { margin-bottom: 2rem; }
.category h2 { color: #ffccff; cursor: pointer; margin-bottom: 0.5rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
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
.card:hover { transform: scale(1.05); background: #660099; }
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

<div id="sidebar">
  <header>
    <img src="assets/logo.png" alt="Logo">
  </header>
  <ul id="categoryList">
    ${Object.keys(categories).map(cat => `<li onclick="filterCategory('${cat}')">${cat}</li>`).join('')}
  </ul>
</div>

<div id="content">
  <div id="controls">
    <button id="backBtn" onclick="closeGame()">← Back</button>
    <span id="gameTitle"></span>
    <button id="fullscreenBtn" onclick="toggleFullscreen()">⛶ Fullscreen</button>
  </div>

  <div class="viewer" id="viewer">
    <div class="viewer-inner">
      <div id="startOverlay">
        <img id="startThumb" src="" alt="Game Thumbnail">
        <h1 id="startName"></h1>
        <button id="startButton" onclick="startGame()">▶ Play</button>
      </div>
      <iframe id="gameFrame" src="" scrolling="no"></iframe>
    </div>
  </div>

  <div id="allGames">
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
</div>

<script>
// (JavaScript is same as your previous working version)
</script>
</body>
</html>
`;

fs.writeFileSync(outputFile, html);
console.log(`✅ Game viewer now has black borders and scrollbars hidden`);
