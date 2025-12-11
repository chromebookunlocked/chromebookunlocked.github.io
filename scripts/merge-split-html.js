const fs = require("fs");
const path = require("path");

const gamesDir = path.join(__dirname, "..", "games");

/**
 * Merge split HTML files (index1.html, index2.html, etc.) into a single index.html
 * This is useful when a game's HTML file exceeds upload size restrictions
 */
function mergeSplitHTMLFiles() {
  console.log("\n🔗 Scanning for split HTML files...\n");

  const gameFolders = fs.readdirSync(gamesDir).filter(f => {
    return fs.statSync(path.join(gamesDir, f)).isDirectory();
  });

  let mergedCount = 0;
  let skippedCount = 0;

  gameFolders.forEach(gameFolder => {
    const gamePath = path.join(gamesDir, gameFolder);

    // Check if index1.html exists (indicates split files)
    const index1Path = path.join(gamePath, "index1.html");

    if (fs.existsSync(index1Path)) {
      console.log(`📦 Found split files in: ${gameFolder}`);

      // Find all indexed HTML files (index1.html, index2.html, etc.)
      const files = fs.readdirSync(gamePath);
      const splitFiles = files
        .filter(file => /^index\d+\.html$/.test(file))
        .sort((a, b) => {
          // Sort by number: index1.html, index2.html, index3.html, etc.
          const numA = parseInt(a.match(/\d+/)[0]);
          const numB = parseInt(b.match(/\d+/)[0]);
          return numA - numB;
        });

      if (splitFiles.length === 0) {
        console.log(`   ⚠️  No valid split files found (expected index1.html, index2.html, etc.)`);
        skippedCount++;
        return;
      }

      console.log(`   Found ${splitFiles.length} parts: ${splitFiles.join(", ")}`);

      // Read and concatenate all split files
      let mergedContent = "";
      splitFiles.forEach(file => {
        const filePath = path.join(gamePath, file);
        const content = fs.readFileSync(filePath, "utf8");
        mergedContent += content;
      });

      // Write merged content to index.html
      const outputPath = path.join(gamePath, "index.html");
      fs.writeFileSync(outputPath, mergedContent, "utf8");

      const sizeKB = (mergedContent.length / 1024).toFixed(2);
      console.log(`   ✅ Merged into index.html (${sizeKB} KB)\n`);

      mergedCount++;
    } else {
      // No split files, skip silently
      skippedCount++;
    }
  });

  // Summary
  console.log(`📊 Summary:`);
  console.log(`   ✅ Merged: ${mergedCount} game(s)`);
  console.log(`   ⏭️  Skipped: ${skippedCount} game(s) (no split files)\n`);

  if (mergedCount > 0) {
    console.log(`✨ Successfully merged ${mergedCount} split HTML file(s)!\n`);
  } else {
    console.log(`ℹ️  No split HTML files found to merge.\n`);
  }
}

mergeSplitHTMLFiles();
