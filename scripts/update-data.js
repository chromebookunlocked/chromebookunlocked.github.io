const fs = require("fs");
const path = require("path");

const gamesDir = path.join(__dirname, "..", "games");
const dataDir = path.join(__dirname, "..", "data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

function generateGameData(folderName) {
  return {
    name: folderName,
    category: "Uncategorized"
  };
}

function syncGames() {
  const games = fs.readdirSync(gamesDir).filter(f => {
    return fs.statSync(path.join(gamesDir, f)).isDirectory();
  });

  // 1. Create/Update JSON for existing games
  games.forEach(game => {
    const jsonFile = path.join(dataDir, `${game}.json`);
    if (!fs.existsSync(jsonFile)) {
      const data = generateGameData(game);
      fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));
      console.log(`✅ Created ${game}.json`);
    }
  });

  // 2. Delete JSON files for removed games
  const jsonFiles = fs.readdirSync(dataDir);
  jsonFiles.forEach(file => {
    const gameName = path.basename(file, ".json");
    if (!games.includes(gameName)) {
      fs.unlinkSync(path.join(dataDir, file));
      console.log(`🗑️ Deleted ${file}`);
    }
  });
}

syncGames();
