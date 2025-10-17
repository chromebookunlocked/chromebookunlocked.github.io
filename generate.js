const fs = require("fs");
const path = require("path");

const gamesDir = path.join(__dirname, "games");
const outputDir = path.join(__dirname, "dist");
const outputFile = path.join(outputDir, "index.html");
const templateFile = path.join(__dirname, "index.template.html");

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const games = fs.readdirSync(gamesDir).filter(f =>
  fs.lstatSync(path.join(gamesDir, f)).isDirectory()
);

// Create stats.json for each game if missing
games.forEach(game => {
  const statsFile = path.join(gamesDir, game, "stats.json");
  if (!fs.existsSync(statsFile)) {
    const data = {
      id: game,
      category: "Uncategorized",
      impressions: 0,
      opens: 0,
      timePlayed: 0
    };
    fs.writeFileSync(statsFile, JSON.stringify(data, null, 2));
  }
});

// Load stats to build game list
const gameData = games.map(game => {
  const statsFile = path.join(gamesDir, game, "stats.json");
  const data = JSON.parse(fs.readFileSync(statsFile, "utf-8"));
  const thumbPath = ["thumbnail.png", "thumbnail.jpg", "thumb.png", "thumb.jpg"]
    .find(img => fs.existsSync(path.join(gamesDir, game, img)));
  return {
    id: game,
    category: data.category || "Uncategorized",
    thumb: thumbPath || ""
  };
});

// Delete stats for removed folders automatically
const statFiles = fs.readdirSync(gamesDir)
  .filter(f => fs.existsSync(path.join(gamesDir, f, "stats.json")));
statFiles.forEach(stat => {
  if (!games.includes(stat)) {
    fs.unlinkSync(path.join(gamesDir, stat, "stats.json"));
  }
});

let template = fs.readFileSync(templateFile, "utf-8");
template = template.replace("__GAMES__", JSON.stringify(gameData));

fs.writeFileSync(outputFile, template);
console.log(`✅ Built ${games.length} games with categories & stats`);
