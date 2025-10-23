const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "data");
const gamesDir = path.join(__dirname, "games");
const outputDir = path.join(__dirname, "dist");
const templateFile = path.join(__dirname, "index.template.html");
const outputFile = path.join(outputDir, "index.html");

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// Load template
const template = fs.readFileSync(templateFile, "utf8");

// Load all game metadata
const games = fs.readdirSync(dataDir)
  .filter(f => f.endsWith(".json"))
  .map(f => {
    const json = JSON.parse(fs.readFileSync(path.join(dataDir, f), "utf8"));
    const folder = json.folder || f.replace(".json", "");
    const thumbs = json.thumbs && json.thumbs.length ? json.thumbs : ["thumbnail.png", "thumbnail.jpg"];
    const thumb = thumbs.find(t => fs.existsSync(path.join(gamesDir, folder, t))) || thumbs[0];
    return {
      name: json.name || folder,
      folder,
      category: json.category || "Uncategorized",
      thumb
    };
  });

// Replace placeholder in template
const html = template.replace("__GAMES__", JSON.stringify(games, null, 2));

// Write output file
fs.writeFileSync(outputFile, html);
console.log(`✅ Build complete: ${games.length} games added to dist/index.html`);
