const fs = require("fs");
const path = require("path");

const gamesDir = path.join(__dirname, "games");
const outputDir = path.join(__dirname, "dist");
const outputFile = path.join(outputDir, "index.html");

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const games = fs
  .readdirSync(gamesDir)
  .filter((file) => fs.lstatSync(path.join(gamesDir, file)).isDirectory());

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>🎮 My Game Arcade</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: sans-serif; background: #121212; color: white; margin: 0; overflow-x: hidden; }
    h1 { margin: 20px; text-align: center; }

    .viewer {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 70vh;
      background: black;
      z-index: 10;
    }

    iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    #closeBtn {
      position: absolute;
      top: 10px;
      right: 10px;
      background: red;
      color: white;
      border: none;
      font-size: 20px;
      padding: 5px 10px;
      cursor: pointer;
      border-radius: 5px;
      z-index: 11;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 20px;
      max-width: 1200px;
      margin: auto;
      padding-top: 75vh; /* push grid below game viewer */
    }

    .card {
      background: #1e1e1e;
      padding: 10px;
      border-radius: 10px;
      transition: transform 0.2s;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
    }

    .card:hover {
      transform: scale(1.05);
      background: #292929;
    }

    .thumb {
      width: 180px;
      height: 120px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 10px;
      background: #333;
    }
  </style>
</head>
<body>
  <div class="viewer">
    <button id="closeBtn" onclick="closeGame()">✖</button>
    <iframe id="gameFrame" src=""></iframe>
  </div>

  <h1>🎮 My Game Arcade</h1>
  <div class="grid">
    ${games.map((g) => {
      const thumbPath = ["thumbnail.png", "thumbnail.jpg", "thumb.png", "thumb.jpg"]
        .find((img) => fs.existsSync(path.join(gamesDir, g, img)));
      const thumbTag = thumbPath
        ? `<img class="thumb" src="games/${g}/${thumbPath}" alt="${g} thumbnail">`
        : `<div class="thumb"></div>`;

      // Make folder name look nicer
      const prettyName = g.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());

      return `
        <div class="card" onclick="openGame('games/${g}/index.html')">
          ${thumbTag}
          <div>${prettyName}</div>
        </div>
      `;
    }).join("")}
  </div>

  <script>
    const viewer = document.querySelector('.viewer');
    const frame = document.getElementById('gameFrame');

    function openGame(url) {
      frame.src = url;
      viewer.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function closeGame() {
      frame.src = '';
      viewer.style.display = 'none';
    }

    // Prevent arrow keys and spacebar from scrolling when in game
    window.addEventListener('keydown', function(e) {
      const blockedKeys = ['ArrowUp', 'ArrowDown', ' ', 'Spacebar'];
      if (viewer.style.display === 'block' && blockedKeys.includes(e.key)) {
        e.preventDefault();
      }
    }, false);
  </script>
</body>
</html>
`;

fs.writeFileSync(outputFile, html);
console.log(`✅ Generated arcade with ${games.length} games`);
