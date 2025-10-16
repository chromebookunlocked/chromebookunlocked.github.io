const fs = require("fs");
const path = require("path");

const gamesDir = path.join(__dirname, "games");
const outputDir = path.join(__dirname, "dist");
const outputFile = path.join(outputDir, "index.html");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const games = fs
  .readdirSync(gamesDir)
  .filter((file) => fs.lstatSync(path.join(gamesDir, file)).isDirectory());

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My Game Arcade</title>
  <style>
    body { font-family: sans-serif; background: #121212; color: white; text-align: center; }
    h1 { margin-top: 40px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 20px; max-width: 1000px; margin: auto; }
    .card { background: #1e1e1e; padding: 10px; border-radius: 10px; transition: transform 0.2s; display: flex; flex-direction: column; align-items: center; }
    .card:hover { transform: scale(1.05); background: #292929; }
    .thumb { width: 180px; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 10px; background: #333; }
    a { color: #00eaff; text-decoration: none; font-size: 18px; }
  </style>
</head>
<body>
  <h1>🎮 My Game Arcade</h1>
  <div class="grid">
    ${games
      .map((g) => {
        const thumbPath = ["thumbnail.png", "thumbnail.jpg", "thumb.png", "thumb.jpg"]
          .find((img) => fs.existsSync(path.join(gamesDir, g, img)));

        const thumbTag = thumbPath
          ? `<img class="thumb" src="games/${g}/${thumbPath}" alt="${g} thumbnail">`
          : `<div class="thumb"></div>`;

        return `
          <div class="card">
            ${thumbTag}
            <a href="games/${g}/index.html" target="_blank">${g}</a>
          </div>
        `;
      })
      .join("")}
  </div>
</body>
</html>
`;

fs.writeFileSync(outputFile, html);
console.log(`✅ Generated index.html with ${games.length} games`);
