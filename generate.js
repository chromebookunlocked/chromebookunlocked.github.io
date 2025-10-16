// generate.js
const fs = require("fs");
const path = require("path");

const gamesDir = path.join(__dirname, "games");
const outputFile = path.join(__dirname, "dist", "index.html");

// make sure dist folder exists
if (!fs.existsSync(path.join(__dirname, "dist"))) {
  fs.mkdirSync(path.join(__dirname, "dist"));
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
    .card { background: #1e1e1e; padding: 20px; border-radius: 10px; transition: transform 0.2s; }
    .card:hover { transform: scale(1.05); background: #292929; }
    a { color: #00eaff; text-decoration: none; font-size: 18px; }
  </style>
</head>
<body>
  <h1>🎮 My Game Arcade</h1>
  <div class="grid">
    ${games
      .map(
        (g) => `
        <div class="card">
          <a href="games/${g}/index.html" target="_blank">${g}</a>
        </div>`
      )
      .join("")}
  </div>
</body>
</html>
`;

fs.writeFileSync(outputFile, html);
console.log(`✅ Generated index.html with ${games.length} games`);
