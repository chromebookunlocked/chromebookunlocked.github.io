const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const dataDir = path.join(rootDir, "data");

/**
 * Get all valid game names from data/*.json files
 */
function getValidGameNames() {
  const jsonFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  return jsonFiles.map(f => path.basename(f, '.json'));
}

/**
 * Get all game HTML files in the root directory
 */
function getGameHTMLFiles() {
  const files = fs.readdirSync(rootDir);

  // Filter for .html files, excluding special files
  const specialFiles = [
    'index.html',
    'index.template.html',
    'dmca.html',
    'google0d95473435a7c986.html'
  ];

  return files.filter(f => {
    return f.endsWith('.html') && !specialFiles.includes(f);
  });
}

/**
 * Clean up orphaned game HTML pages
 */
function cleanupOrphanedPages() {
  console.log('\n🧹 Cleaning up orphaned game HTML pages...\n');

  const validGameNames = getValidGameNames();
  const gameHTMLFiles = getGameHTMLFiles();

  let deleted = 0;
  let kept = 0;

  gameHTMLFiles.forEach(htmlFile => {
    const gameName = path.basename(htmlFile, '.html');

    // Check if this game has a corresponding JSON file
    if (!validGameNames.includes(gameName)) {
      const filePath = path.join(rootDir, htmlFile);
      fs.unlinkSync(filePath);
      console.log(`🗑️  Deleted ${htmlFile} (no corresponding data/${gameName}.json)`);
      deleted++;
    } else {
      kept++;
    }
  });

  // Summary
  console.log(`\n📊 Cleanup Summary:`);
  console.log(`   🗑️  Deleted: ${deleted} orphaned HTML pages`);
  console.log(`   ✓ Kept: ${kept} valid game pages`);
  console.log(`   📝 Total JSON files: ${validGameNames.length}\n`);

  if (deleted > 0) {
    console.log(`✨ Removed ${deleted} orphaned game page(s)\n`);
  } else {
    console.log(`✓ No orphaned pages found\n`);
  }
}

cleanupOrphanedPages();
