const fs = require("fs");
const path = require("path");

const gamesDir = path.join(__dirname, "..", "games");
const dataDir = path.join(__dirname, "..", "data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Valid thumbnail extensions
const validThumbnailExts = ['.webp', '.png', '.jpg', '.jpeg', '.gif'];

/**
 * Check if a game folder has a valid index.html file
 */
function hasValidIndexHTML(gamePath) {
  const indexPath = path.join(gamePath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return false;
  }

  // Check if file is not empty
  const stats = fs.statSync(indexPath);
  return stats.size > 0;
}

/**
 * Check if a game folder has a valid thumbnail
 */
function hasValidThumbnail(gamePath) {
  const files = fs.readdirSync(gamePath);

  // Check for any thumbnail file with valid extension
  const hasThumbnail = files.some(file => {
    const ext = path.extname(file).toLowerCase();
    const basename = path.basename(file, ext).toLowerCase();

    // Look for files named "thumbnail" with valid extensions
    if (basename === 'thumbnail' && validThumbnailExts.includes(ext)) {
      const filePath = path.join(gamePath, file);
      const stats = fs.statSync(filePath);
      return stats.size > 0; // Must not be empty
    }
    return false;
  });

  return hasThumbnail;
}

/**
 * Validate a game folder
 * Returns validation result with separate flags for critical vs warning issues
 */
function validateGameFolder(gamePath, folderName) {
  const errors = [];   // Critical - game cannot be added
  const warnings = []; // Non-critical - game can still be added

  if (!hasValidIndexHTML(gamePath)) {
    errors.push('missing or empty index.html');
  }

  if (!hasValidThumbnail(gamePath)) {
    warnings.push(`missing thumbnail (will use fallback)`);
  }

  return {
    valid: errors.length === 0,  // Only errors prevent adding the game
    errors: errors,
    warnings: warnings
  };
}

/**
 * Generate initial game data JSON
 *
 * Optional fields you can add manually:
 * - displayName: Override the display name (defaults to folder name)
 * - otherNames: Alternative names for search (array or comma-separated string)
 *
 * Example: {
 *   "name": "BTD5",
 *   "displayName": "Bloons Tower Defense 5",
 *   "otherNames": ["BTD 5", "Bloons TD 5"],
 *   "category": "Tower Defence, Strategy"
 * }
 */
function generateGameData(folderName) {
  return {
    name: folderName,
    category: "Uncategorized"
  };
}

function syncGames() {
  const gameFolders = fs.readdirSync(gamesDir).filter(f => {
    return fs.statSync(path.join(gamesDir, f)).isDirectory();
  });

  console.log(`\n🔍 Found ${gameFolders.length} game folders in games/\n`);

  let created = 0;
  let skipped = 0;
  let deleted = 0;

  // 1. Create/Update JSON for existing games (with validation)
  gameFolders.forEach(game => {
    const gamePath = path.join(gamesDir, game);
    const jsonFile = path.join(dataDir, `${game}.json`);

    // Validate game folder
    const validation = validateGameFolder(gamePath, game);

    // Show warnings (non-critical issues)
    if (validation.warnings.length > 0) {
      console.log(`⚠️  Warning for ${game}:`);
      validation.warnings.forEach(warning => {
        console.log(`   - ${warning}`);
      });
    }

    // Skip if there are critical errors
    if (!validation.valid) {
      console.log(`❌ Skipped ${game}:`);
      validation.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
      skipped++;
      return;
    }

    // Create JSON if it doesn't exist
    if (!fs.existsSync(jsonFile)) {
      const data = generateGameData(game);
      fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));
      console.log(`✅ Created ${game}.json`);
      created++;
    } else {
      console.log(`✓ ${game}.json already exists`);
    }
  });

  // 2. Delete JSON files for removed games
  const jsonFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  jsonFiles.forEach(file => {
    const gameName = path.basename(file, ".json");
    if (!gameFolders.includes(gameName)) {
      fs.unlinkSync(path.join(dataDir, file));
      console.log(`🗑️  Deleted ${file} (game folder removed)`);
      deleted++;
    }
  });

  // Summary
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⚠️  Skipped (invalid): ${skipped}`);
  console.log(`   🗑️  Deleted: ${deleted}`);
  console.log(`   ✓ Total valid games: ${gameFolders.length - skipped}\n`);

  if (skipped > 0) {
    console.log(`⚠️  Warning: ${skipped} game(s) were skipped due to validation issues.`);
    console.log(`   Fix the issues above and run this script again.\n`);
  }
}

syncGames();
