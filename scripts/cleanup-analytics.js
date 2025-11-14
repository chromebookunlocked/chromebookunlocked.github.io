const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");

function cleanupAnalyticsFields() {
  const jsonFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

  let cleaned = 0;

  jsonFiles.forEach(file => {
    const filePath = path.join(dataDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Check if analytics fields exist
    if (data.hasOwnProperty('impressions') || data.hasOwnProperty('opens')) {
      // Remove analytics fields
      delete data.impressions;
      delete data.opens;

      // Write back cleaned data
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      cleaned++;
      console.log(`✅ Cleaned ${file}`);
    }
  });

  console.log(`\n✨ Cleanup complete! Removed analytics from ${cleaned} files.`);
}

cleanupAnalyticsFields();
