const fs = require("fs");
const path = require("path");

const gamesDir = path.join(__dirname, "games");
const dataDir = path.join(__dirname, "data");
const distDir = path.join(__dirname, "dist");
const outputFile = path.join(distDir, "index.html");

// make sure dist folder exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// make sure data folder exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// read all JSON files from data
const gameDataFiles = fs.readdirSync(dataDir).filter(file => file.endsWith(".json"));

const categories = {};

gameDataFiles.forEach(file => {
  const filePath = path.join(dataDir, file);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    // only add game if folder exists
    const gameFolder = path.join(gamesDir, data.name);
    if (fs.existsSync(gameFolder)) {
      if (!categories[data.category]) categories[data.category] = [];
      categories[data.category].push(data);
    }
  } catch (err) {
    console.error(`❌ Failed to parse ${file}:`, err);
  }
});

// start building HTML
let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Arcade</title>
  <style>
    body {
      background: #111;
      color: #fff;
      font-family: system-ui, sans-serif;
      margin: 0;
      padding: 0 20px;
    }
    h1 {
      text-align: center;
      margin-top: 20px;
    }
    h2 {
      margin-top: 40px;
    }
    .game-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: flex-start;
      margin-top: 10px;
    }
    .game-card {
      width: 200px;
      background: #222;
      padding: 10px;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .game-card:hover {
      transform: scale(1.05);
      background: #333;
    }
    .game-card img {
      width: 100%;
      border-radius: 6px;
      height: 120px;
      object-fit: cover;
    }
    .game-card p {
      text-align: center;
      margin: 8px 0 0;
    }
    #game-view {
      margin-top: 20px;
      text-align: center;
    }
    iframe {
      width: 100%;
      max-width: 1000px;
      height: 600px;
      border: none;
      border-radius: 10px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <h1>🎮 Arcade</h1>
  <div id="game-view"></div>
`;

// categories and games
for (const category in categories) {
  html += `<h2>${category}</h2><div class="game-grid">`;
  categories[category].forEach(game => {
    const thumbPath = `games/${game.name}/thumbnail.png`;
    html += `
      <div class="game-card" onclick="openGame('${game.name}')">
        <img src="${thumbPath}" alt="${game.name}">
        <p>${game.name}</p>
      </div>
    `;
  });
  html += `</div>`;
}

html += `
  <script>
    const gameView = document.getElementById('game-view');

    function openGame(name) {
      gameView.innerHTML = \`
        <iframe src="games/\${name}/index.html"></iframe>
      \`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // prevent spacebar and arrow keys from scrolling
    window.addEventListener('keydown', function(e) {
      if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }
    }, false);
  </script>
</body>
</html>
`;

// write to dist/index.html
fs.writeFileSync(outputFile, html);
console.log(`✅ index.html generated with ${gameDataFiles.length} game(s)`);
