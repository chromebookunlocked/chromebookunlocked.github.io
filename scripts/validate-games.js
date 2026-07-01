const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
const gamesDir = path.join(__dirname, "..", "games");

// ANSI color codes for better output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m"
};

let errors = 0;
let warnings = 0;
let passed = 0;

function error(msg) {
  console.log(`${colors.red}❌ ERROR: ${msg}${colors.reset}`);
  errors++;
}

function warn(msg) {
  console.log(`${colors.yellow}⚠️  WARNING: ${msg}${colors.reset}`);
  warnings++;
}

function success(msg) {
  console.log(`${colors.green}✓ ${msg}${colors.reset}`);
  passed++;
}

function info(msg) {
  console.log(`${colors.cyan}ℹ  ${msg}${colors.reset}`);
}

console.log(`${colors.magenta}
╔═══════════════════════════════════════════╗
║   🎮 Game Validation Script 🎮          ║
╚═══════════════════════════════════════════╝
${colors.reset}`);

// Get all JSON files
const jsonFiles = fs.readdirSync(dataDir).filter(f => f.endsWith(".json"));
console.log(`\n${colors.blue}Found ${jsonFiles.length} game metadata files${colors.reset}\n`);

// Valid categories come from the canonical vocabulary in tags.json
const { loadTagsConfig } = require("./lib/tag-utils");
const tagsConfig = loadTagsConfig();
const validCategories = tagsConfig.tags;
const categoryAliases = Object.keys(tagsConfig.aliases || {});

jsonFiles.forEach((file, index) => {
  const gameName = path.basename(file, ".json");
  console.log(`${colors.cyan}[${index + 1}/${jsonFiles.length}] Validating: ${gameName}${colors.reset}`);

  const jsonPath = path.join(dataDir, file);

  // 1. Check if JSON is valid
  let gameData;
  try {
    const content = fs.readFileSync(jsonPath, "utf8");
    gameData = JSON.parse(content);
  } catch (e) {
    error(`${file} - Invalid JSON: ${e.message}`);
    return;
  }

  // 2. Check required fields
  if (!gameData.name) {
    error(`${file} - Missing required field: "name"`);
  } else if (gameData.name.trim() === "") {
    error(`${file} - Field "name" is empty`);
  }

  if (!gameData.category && !gameData.categories) {
    error(`${file} - Missing required field: "category" or "categories"`);
  }

  // 3. Validate category values
  let categories = [];
  if (gameData.category) {
    if (typeof gameData.category === "string") {
      categories = gameData.category.split(",").map(c => c.trim());
    } else {
      error(`${file} - Field "category" must be a string`);
    }
  }
  if (gameData.categories) {
    if (Array.isArray(gameData.categories)) {
      categories = [...categories, ...gameData.categories];
    } else {
      error(`${file} - Field "categories" must be an array`);
    }
  }

  categories.forEach(cat => {
    if (categoryAliases.includes(cat)) {
      warn(`${file} - Category "${cat}" is a known typo/alias. Run "npm run normalize-tags" to fix it.`);
    } else if (!validCategories.includes(cat)) {
      warn(`${file} - Unknown category: "${cat}". Add it to tags.json or run "npm run normalize-tags".`);
    }
  });

  // 4. Check for deprecated fields
  if (gameData.impressions !== undefined) {
    warn(`${file} - Contains deprecated field "impressions" (should be removed)`);
  }
  if (gameData.opens !== undefined) {
    warn(`${file} - Contains deprecated field "opens" (should be removed)`);
  }

  // 5. Check game folder exists
  const folderName = gameData.folder || gameName;
  const gamePath = path.join(gamesDir, folderName);

  if (!fs.existsSync(gamePath)) {
    error(`${file} - Game folder not found: ${folderName}`);
    return;
  }

  // 6. Check index.html exists
  const indexPath = path.join(gamePath, "index.html");
  if (!fs.existsSync(indexPath)) {
    error(`${file} - Missing index.html in ${folderName}/`);
  } else {
    // Check if index.html is not empty
    const indexStats = fs.statSync(indexPath);
    if (indexStats.size === 0) {
      error(`${file} - index.html in ${folderName}/ is empty`);
    } else if (indexStats.size < 100) {
      warn(`${file} - index.html in ${folderName}/ is very small (${indexStats.size} bytes)`);
    }
  }

  // 7. Check thumbnail exists
  const thumbnails = gameData.thumbs || ["thumbnail.webp", "thumbnail.png", "thumbnail.jpg"];
  let foundThumbnail = false;

  thumbnails.forEach(thumb => {
    const thumbPath = path.join(gamePath, thumb);
    if (fs.existsSync(thumbPath)) {
      foundThumbnail = true;
      // Check thumbnail size
      const thumbStats = fs.statSync(thumbPath);
      if (thumbStats.size === 0) {
        error(`${file} - Thumbnail ${thumb} is empty`);
      } else if (thumbStats.size > 500 * 1024) {
        warn(`${file} - Thumbnail ${thumb} is large (${(thumbStats.size / 1024).toFixed(0)}KB, recommend <500KB)`);
      }
    }
  });

  if (!foundThumbnail) {
    warn(`${file} - No thumbnail found (will use fallback). Looking for: ${thumbnails.join(", ")}`);
  }

  // 8. Check for common issues
  if (gameData.name && gameData.name !== gameName) {
    info(`${file} - Name in JSON ("${gameData.name}") differs from filename ("${gameName}")`);
  }

  // If no errors for this game, count as passed
  const gameErrors = errors;
  if (errors === 0 || gameErrors === errors) {
    success(`${gameName} - All checks passed`);
  }

  console.log(""); // Empty line between games
});

// Check for orphaned game folders (folders without JSON)
console.log(`\n${colors.blue}Checking for orphaned game folders...${colors.reset}\n`);

const gameFolders = fs.readdirSync(gamesDir).filter(f => {
  const stat = fs.statSync(path.join(gamesDir, f));
  return stat.isDirectory();
});

gameFolders.forEach(folder => {
  const jsonFile = path.join(dataDir, `${folder}.json`);
  if (!fs.existsSync(jsonFile)) {
    warn(`Game folder "${folder}" exists but has no metadata JSON file`);
  }
});

// Summary
console.log(`\n${colors.magenta}═══════════════════════════════════════════${colors.reset}`);
console.log(`${colors.green}✓ Passed: ${passed}${colors.reset}`);
console.log(`${colors.yellow}⚠  Warnings: ${warnings}${colors.reset}`);
console.log(`${colors.red}❌ Errors: ${errors}${colors.reset}`);
console.log(`${colors.magenta}═══════════════════════════════════════════${colors.reset}\n`);

if (errors > 0) {
  console.log(`${colors.red}Validation FAILED with ${errors} error(s)${colors.reset}`);
  process.exit(1);
} else if (warnings > 0) {
  console.log(`${colors.yellow}Validation passed with ${warnings} warning(s)${colors.reset}`);
  process.exit(0);
} else {
  console.log(`${colors.green}✨ All validation checks PASSED! ✨${colors.reset}`);
  process.exit(0);
}
